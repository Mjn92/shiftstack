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

const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM employees WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO employees 
       (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, role`,
      [first_name, last_name, email, password_hash, role || "employee"],
    );

    await createAuditLog({
      employee_id: result.rows[0].id,
      action: "REGISTER",
      details: `New employee registered: ${result.rows[0].email}`,
    });

    res.status(201).json({
      message: "Employee registered successfully",
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM employees WHERE email = $1 AND active = TRUE",
      [email],
    );

    if (result.rows.length === 0) {
      await createAuditLog({
        employee_id: null,
        action: "FAILED_LOGIN",
        details: `Failed login attempt for email: ${email}`,
      });

      return res.status(401).json({ error: "Invalid email or password" });
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

      return res.status(401).json({ error: "Invalid email or password" });
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
  (employee_id, token, expires_at)
  VALUES ($1, $2, NOW() + INTERVAL '7 days')
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
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token required",
      });
    }

    const storedToken = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken],
    );

    if (storedToken.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid refresh token",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const employeeResult = await pool.query(
      "SELECT id, first_name, last_name, email, role FROM employees WHERE id = $1",
      [decoded.id],
    );

    if (employeeResult.rows.length === 0) {
      return res.status(401).json({
        error: "Employee not found",
      });
    }

    const employee = employeeResult.rows[0];

    const accessToken = generateAccessToken(employee);

    await createAuditLog({
      employee_id: employee.id,
      action: "TOKEN_REFRESH",
      details: "Access token refreshed",
    });

    res.json({
      accessToken,
    });
  } catch (err) {
    console.error(err);

    res.status(401).json({
      error: "Invalid refresh token",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
      refreshToken,
    ]);

    await createAuditLog({
      employee_id: req.user.id,
      action: "LOGOUT",
      details: "Employee logged out",
    });

    res.json({
      message: "Logout successful",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Logout failed",
    });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, role FROM employees WHERE id = $1",
      [req.user.id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
