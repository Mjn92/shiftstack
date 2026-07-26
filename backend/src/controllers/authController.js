const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const { createAuditLog } = require("../services/auditLogService");
const {
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
} = require("../config/security");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokenService");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function isValidPhoneNumber(value) {
  return /^[0-9()+\-\s.]{7,25}$/.test(value);
}

function validatePassword(password) {
  const value = typeof password === "string" ? password : "";

  const rules = {
    length: value.length >= 12,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  return {
    rules,
    valid: Object.values(rules).every(Boolean),
  };
}

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

const register = async (req, res) => {
  try {
    const firstName =
      typeof req.body.first_name === "string" ? req.body.first_name.trim() : "";

    const lastName =
      typeof req.body.last_name === "string" ? req.body.last_name.trim() : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body.password;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: "All required fields must be provided",
      });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({
        error: "First and last names must be 50 characters or fewer",
      });
    }

    const passwordValidation = validatePassword(password);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        error:
          "Password must be at least 12 characters and include uppercase, lowercase, number, and special characters.",
      });
    }

    const existingUser = await pool.query(
      `
        SELECT id
        FROM employees
        WHERE LOWER(email) = LOWER($1)
      `,
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
        INSERT INTO employees
          (
            first_name,
            last_name,
            email,
            password_hash,
            role
          )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          first_name,
          last_name,
          email,
          role
      `,
      [firstName, lastName, email, passwordHash, "employee"],
    );

    await createAuditLog({
      employee_id: result.rows[0].id,
      action: "REGISTER",
      details: `New employee registered: ${result.rows[0].email}`,
    });

    return res.status(201).json({
      message: "Employee registered successfully",
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Register error:", err);

    return res.status(500).json({
      error: "Could not register employee",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

const login = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await pool.query(
      `
        SELECT *
        FROM employees
        WHERE LOWER(email) = LOWER($1)
          AND active = TRUE
      `,
      [email],
    );

    if (result.rows.length === 0) {
      await createAuditLog({
        employee_id: null,
        action: "FAILED_LOGIN",
        details: `Failed login attempt for email: ${email}`,
      });

      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const employee = result.rows[0];

    const now = new Date();

    if (
      employee.account_locked_until &&
      new Date(employee.account_locked_until) > now
    ) {
      return res.status(423).json({
        error: "Account temporarily locked. Please try again later.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      employee.password_hash,
    );

    if (!passwordMatch) {
      const failedAttempts = Number(employee.failed_login_attempts || 0) + 1;

      let lockedUntil = null;

      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
      }

      await pool.query(
        `
          UPDATE employees
          SET
            failed_login_attempts = $1,
            last_failed_login = NOW(),
            account_locked_until = $2
          WHERE id = $3
        `,
        [failedAttempts, lockedUntil, employee.id],
      );

      await createAuditLog({
        employee_id: employee.id,
        action: "FAILED_LOGIN",
        details: `Failed password attempt for email: ${email}`,
      });

      if (lockedUntil) {
        await createAuditLog({
          employee_id: employee.id,
          action: "ACCOUNT_LOCKED",
          details: `Account locked after ${failedAttempts} failed login attempts`,
        });

        return res.status(423).json({
          error: "Account temporarily locked. Please try again later.",
        });
      }

      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    await pool.query(
      `
        UPDATE employees
        SET
          failed_login_attempts = 0,
          account_locked_until = NULL,
          last_failed_login = NULL
        WHERE id = $1
      `,
      [employee.id],
    );

    const accessToken = generateAccessToken(employee);

    const refreshToken = generateRefreshToken(employee);

    await pool.query(
      `
        INSERT INTO refresh_tokens
          (
            employee_id,
            token,
            expires_at
          )
        VALUES (
          $1,
          $2,
          NOW() + INTERVAL '7 days'
        )
      `,
      [employee.id, refreshToken],
    );

    await createAuditLog({
      employee_id: employee.id,
      action: "LOGIN",
      details: `Employee logged in: ${employee.email}`,
    });

    return res.json({
      message: "Login successful",

      accessToken,
      refreshToken,

      employee: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        role: employee.role,
        active: employee.active,
        phone: employee.phone,
        department: employee.department,
        created_at: employee.created_at,
        updated_at: employee.updated_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Refresh Token
|--------------------------------------------------------------------------
*/

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token required",
      });
    }

    const storedToken = await pool.query(
      `
        SELECT *
        FROM refresh_tokens
        WHERE token = $1
          AND expires_at > NOW()
      `,
      [refreshToken],
    );

    if (storedToken.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid or expired refresh token",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const employeeResult = await pool.query(
      `
        SELECT
          id,
          first_name,
          last_name,
          email,
          role
        FROM employees
        WHERE id = $1
          AND active = TRUE
      `,
      [decoded.id],
    );

    if (employeeResult.rows.length === 0) {
      await pool.query(
        `
          DELETE FROM refresh_tokens
          WHERE token = $1
        `,
        [refreshToken],
      );

      return res.status(401).json({
        error: "Employee not found or account inactive",
      });
    }

    const employee = employeeResult.rows[0];

    const accessToken = generateAccessToken(employee);

    const newRefreshToken = generateRefreshToken(employee);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
          DELETE FROM refresh_tokens
          WHERE token = $1
        `,
        [refreshToken],
      );

      await client.query(
        `
          INSERT INTO refresh_tokens
            (
              employee_id,
              token,
              expires_at
            )
          VALUES (
            $1,
            $2,
            NOW() + INTERVAL '7 days'
          )
        `,
        [employee.id, newRefreshToken],
      );

      await client.query("COMMIT");
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    } finally {
      client.release();
    }

    await createAuditLog({
      employee_id: employee.id,
      action: "TOKEN_ROTATED",
      details: "Refresh token rotated",
    });

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh error:", err);

    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token required",
      });
    }

    await pool.query(
      `
        DELETE FROM refresh_tokens
        WHERE token = $1
      `,
      [refreshToken],
    );

    await createAuditLog({
      employee_id: req.user.id,
      action: "LOGOUT",
      details: "Employee logged out",
    });

    return res.json({
      message: "Logout successful",
    });
  } catch (err) {
    console.error("Logout error:", err);

    return res.status(500).json({
      error: "Logout failed",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Current Employee
|--------------------------------------------------------------------------
*/

const me = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          first_name,
          last_name,
          email,
          role,
          active,
          phone,
          department,
          created_at,
          updated_at
        FROM employees
        WHERE id = $1
      `,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Me error:", err);

    return res.status(500).json({
      error: "Could not load employee profile",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Employee Profile
|--------------------------------------------------------------------------
*/

const updateProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const firstName =
      typeof req.body.first_name === "string" ? req.body.first_name.trim() : "";

    const lastName =
      typeof req.body.last_name === "string" ? req.body.last_name.trim() : "";

    const phone =
      typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    if (!firstName || !lastName) {
      return res.status(400).json({
        error: "First name and last name are required",
      });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({
        error: "First and last names must be 50 characters or fewer",
      });
    }

    if (phone && !isValidPhoneNumber(phone)) {
      return res.status(400).json({
        error: "Enter a valid phone number",
      });
    }

    const result = await pool.query(
      `
        UPDATE employees
        SET
          first_name = $1,
          last_name = $2,
          phone = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING
          id,
          first_name,
          last_name,
          email,
          role,
          active,
          phone,
          department,
          created_at,
          updated_at
      `,
      [firstName, lastName, phone || null, employeeId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    await createAuditLog({
      employee_id: employeeId,
      action: "PROFILE_UPDATED",
      details: "Employee updated personal profile information",
    });

    return res.json({
      message: "Profile updated successfully",
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Update profile error:", err);

    return res.status(500).json({
      error: "Could not update profile",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

const changePassword = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    const passwordValidation = validatePassword(new_password);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        error:
          "Password must be at least 12 characters and include uppercase, lowercase, number, and special characters.",
      });
    }

    const result = await pool.query(
      `
        SELECT password_hash
        FROM employees
        WHERE id = $1
          AND active = TRUE
      `,
      [employeeId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const employee = result.rows[0];

    const currentPasswordMatches = await bcrypt.compare(
      current_password,
      employee.password_hash,
    );

    if (!currentPasswordMatches) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(
      new_password,
      employee.password_hash,
    );

    if (samePassword) {
      return res.status(400).json({
        error: "New password must be different from your current password",
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 12);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
          UPDATE employees
          SET
            password_hash = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
        [passwordHash, employeeId],
      );

      /*
       * Security:
       * Changing a password invalidates all refresh
       * tokens belonging to this employee.
       */
      await client.query(
        `
          DELETE FROM refresh_tokens
          WHERE employee_id = $1
        `,
        [employeeId],
      );

      await client.query("COMMIT");
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    } finally {
      client.release();
    }

    await createAuditLog({
      employee_id: employeeId,
      action: "PASSWORD_CHANGED",
      details: "Employee changed account password",
    });

    return res.json({
      message: "Password changed successfully. Please sign in again.",
      session_revoked: true,
    });
  } catch (err) {
    console.error("Change password error:", err);

    return res.status(500).json({
      error: "Could not change password",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  register,
  login,
  refresh,
  me,
  logout,
  updateProfile,
  changePassword,
};
