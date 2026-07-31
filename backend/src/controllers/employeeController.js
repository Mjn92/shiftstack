const bcrypt = require("bcrypt");

const pool = require("../config/db");
const { canManageUser } = require("../utils/permissions");
const { createAuditLog } = require("../services/auditLogService");
const { AUDIT_ACTIONS } = require("../utils/auditActions");

const BCRYPT_ROUNDS = 12;

const getEmployees = async (req, res) => {
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
          department
        FROM employees
        ORDER BY id ASC
      `,
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("Get employees error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId < 1) {
      return res.status(400).json({
        error: "Invalid employee ID",
      });
    }

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
      [employeeId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Get employee error:", err);

    return res.status(500).json({
      error: "Could not load employee",
    });
  }
};

const getTimeEntries = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          time_entries.id,
          time_entries.employee_id,
          employees.first_name,
          employees.last_name,
          employees.email,
          time_entries.clock_in,
          time_entries.clock_out,
          time_entries.total_minutes,
          time_entries.status,
          time_entries.note,
          time_entries.created_at
        FROM time_entries
        JOIN employees
          ON employees.id = time_entries.employee_id
        ORDER BY time_entries.clock_in DESC
      `,
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("Get time entries error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          audit_logs.id,
          audit_logs.employee_id,
          employees.first_name,
          employees.last_name,
          employees.email,
          audit_logs.action,
          audit_logs.details,
          audit_logs.created_at
        FROM audit_logs
        LEFT JOIN employees
          ON employees.id = audit_logs.employee_id
        ORDER BY audit_logs.created_at DESC
      `,
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("Get audit logs error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

const createEmployee = async (req, res) => {
  try {
    const currentUser = req.user;

    const { first_name, last_name, email, password, role, phone, department } =
      req.body;

    const firstName = normalizeRequiredString(first_name);
    const lastName = normalizeRequiredString(last_name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizeOptionalString(phone);
    const normalizedDepartment = normalizeOptionalString(department);

    if (!firstName || !lastName || !normalizedEmail || !password) {
      return res.status(400).json({
        error: "First name, last name, email, and password are required",
      });
    }

    if (firstName.length > 50) {
      return res.status(400).json({
        error: "First name must be 50 characters or fewer",
      });
    }

    if (lastName.length > 50) {
      return res.status(400).json({
        error: "Last name must be 50 characters or fewer",
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: "Enter a valid email address",
      });
    }

    if (normalizedPhone && !isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({
        error: "Enter a valid phone number",
      });
    }

    if (typeof password !== "string" || password.length < 12) {
      return res.status(400).json({
        error: "Password must be at least 12 characters",
      });
    }

    const newRole = role || "employee";

    const allowedRoles = ["employee", "manager", "admin"];

    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({
        error: "Invalid role",
      });
    }

    if (!canManageUser(currentUser.role, newRole, "canCreate")) {
      return res.status(403).json({
        error: "You do not have permission to create this user role",
      });
    }

    const existingEmployee = await pool.query(
      `
        SELECT id
        FROM employees
        WHERE LOWER(email) = LOWER($1)
      `,
      [normalizedEmail],
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(409).json({
        error: "An employee with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await pool.query(
      `
        INSERT INTO employees (
          first_name,
          last_name,
          email,
          password_hash,
          role,
          phone,
          department,
          active,
          updated_by
        )
        VALUES (
          $1,
          $2,
          LOWER($3),
          $4,
          $5,
          $6,
          $7,
          TRUE,
          $8
        )
        RETURNING
          id,
          first_name,
          last_name,
          email,
          role,
          phone,
          department,
          active,
          created_at,
          updated_at
      `,
      [
        firstName,
        lastName,
        normalizedEmail,
        passwordHash,
        newRole,
        normalizedPhone,
        normalizedDepartment,
        currentUser.id,
      ],
    );

    const employee = result.rows[0];

    await createAuditLog({
      employee_id: currentUser.id,
      action: AUDIT_ACTIONS.CREATE_EMPLOYEE,
      details: `Created ${employee.role} account for ${employee.email}`,
    });

    return res.status(201).json({
      message: "Employee created successfully",
      employee,
    });
  } catch (err) {
    console.error("Create employee error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const currentUser = req.user;
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId < 1) {
      return res.status(400).json({
        error: "Invalid employee ID",
      });
    }

    const { first_name, last_name, email, role, phone, department, active } =
      req.body;

    const existingEmployee = await pool.query(
      `
        SELECT
          id,
          email,
          role,
          active
        FROM employees
        WHERE id = $1
      `,
      [employeeId],
    );

    if (existingEmployee.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const targetEmployee = existingEmployee.rows[0];

    if (!canManageUser(currentUser.role, targetEmployee.role, "canEdit")) {
      return res.status(403).json({
        error: "You do not have permission to edit this user",
      });
    }

    const newRole =
      role === undefined || role === null || role === ""
        ? targetEmployee.role
        : role;

    const allowedRoles = ["employee", "manager", "admin"];

    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({
        error: "Invalid role",
      });
    }

    if (newRole !== targetEmployee.role) {
      if (!canManageUser(currentUser.role, newRole, "canChangeRoleTo")) {
        return res.status(403).json({
          error: "You do not have permission to assign this role",
        });
      }
    }

    const normalizedFirstName =
      first_name !== undefined ? normalizeRequiredString(first_name) : null;

    const normalizedLastName =
      last_name !== undefined ? normalizeRequiredString(last_name) : null;

    const normalizedEmail = email !== undefined ? normalizeEmail(email) : null;

    const normalizedPhone =
      phone !== undefined ? normalizeOptionalString(phone) : null;

    const normalizedDepartment =
      department !== undefined ? normalizeOptionalString(department) : null;

    if (first_name !== undefined && !normalizedFirstName) {
      return res.status(400).json({
        error: "First name cannot be empty",
      });
    }

    if (last_name !== undefined && !normalizedLastName) {
      return res.status(400).json({
        error: "Last name cannot be empty",
      });
    }

    if (normalizedFirstName && normalizedFirstName.length > 50) {
      return res.status(400).json({
        error: "First name must be 50 characters or fewer",
      });
    }

    if (normalizedLastName && normalizedLastName.length > 50) {
      return res.status(400).json({
        error: "Last name must be 50 characters or fewer",
      });
    }

    if (email !== undefined && !normalizedEmail) {
      return res.status(400).json({
        error: "Email cannot be empty",
      });
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: "Enter a valid email address",
      });
    }

    if (normalizedPhone && !isValidPhoneNumber(normalizedPhone)) {
      return res.status(400).json({
        error: "Enter a valid phone number",
      });
    }

    if (normalizedEmail) {
      const duplicateEmail = await pool.query(
        `
          SELECT id
          FROM employees
          WHERE LOWER(email) = LOWER($1)
            AND id != $2
        `,
        [normalizedEmail, employeeId],
      );

      if (duplicateEmail.rows.length > 0) {
        return res.status(409).json({
          error: "Another employee already uses this email",
        });
      }
    }

    const result = await pool.query(
      `
        UPDATE employees
        SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE(LOWER($3), email),
          role = $4,
          phone = COALESCE($5, phone),
          department = COALESCE($6, department),
          active = COALESCE($7, active),
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $8
        WHERE id = $9
        RETURNING
          id,
          first_name,
          last_name,
          email,
          role,
          phone,
          department,
          active,
          created_at,
          updated_at
      `,
      [
        normalizedFirstName,
        normalizedLastName,
        normalizedEmail,
        newRole,
        normalizedPhone,
        normalizedDepartment,
        typeof active === "boolean" ? active : null,
        currentUser.id,
        employeeId,
      ],
    );

    const updatedEmployee = result.rows[0];

    await createAuditLog({
      employee_id: currentUser.id,
      action: AUDIT_ACTIONS.UPDATE_EMPLOYEE,
      details: `Updated ${updatedEmployee.role} account for ${updatedEmployee.email}`,
    });

    if (newRole !== targetEmployee.role) {
      await createAuditLog({
        employee_id: currentUser.id,
        action: AUDIT_ACTIONS.CHANGE_EMPLOYEE_ROLE,
        details:
          `Changed role for ${updatedEmployee.email} ` +
          `from ${targetEmployee.role} to ${newRole}`,
      });
    }

    return res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (err) {
    console.error("Update employee error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

const activateEmployee = async (req, res) => {
  try {
    const currentUser = req.user;
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId < 1) {
      return res.status(400).json({
        error: "Invalid employee ID",
      });
    }

    const existingEmployee = await pool.query(
      `
        SELECT
          id,
          email,
          role,
          active
        FROM employees
        WHERE id = $1
      `,
      [employeeId],
    );

    if (existingEmployee.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const targetEmployee = existingEmployee.rows[0];

    if (!canManageUser(currentUser.role, targetEmployee.role, "canActivate")) {
      return res.status(403).json({
        error: "You do not have permission to activate this user",
      });
    }

    if (targetEmployee.active === true) {
      return res.status(400).json({
        error: "Employee is already active",
      });
    }

    const result = await pool.query(
      `
        UPDATE employees
        SET
          active = TRUE,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
        RETURNING
          id,
          first_name,
          last_name,
          email,
          role,
          phone,
          department,
          active,
          created_at,
          updated_at
      `,
      [currentUser.id, employeeId],
    );

    const employee = result.rows[0];

    await createAuditLog({
      employee_id: currentUser.id,
      action: AUDIT_ACTIONS.ACTIVATE_EMPLOYEE,
      details: `Activated ${employee.role} account for ${employee.email}`,
    });

    return res.json({
      message: "Employee activated successfully",
      employee,
    });
  } catch (err) {
    console.error("Activate employee error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

const deactivateEmployee = async (req, res) => {
  try {
    const currentUser = req.user;
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId < 1) {
      return res.status(400).json({
        error: "Invalid employee ID",
      });
    }

    const existingEmployee = await pool.query(
      `
        SELECT
          id,
          email,
          role,
          active
        FROM employees
        WHERE id = $1
      `,
      [employeeId],
    );

    if (existingEmployee.rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found",
      });
    }

    const targetEmployee = existingEmployee.rows[0];

    if (
      !canManageUser(currentUser.role, targetEmployee.role, "canDeactivate")
    ) {
      return res.status(403).json({
        error: "You do not have permission to deactivate this user",
      });
    }

    if (currentUser.id === employeeId) {
      return res.status(400).json({
        error: "You cannot deactivate your own account",
      });
    }

    if (targetEmployee.active === false) {
      return res.status(400).json({
        error: "Employee is already inactive",
      });
    }

    const result = await pool.query(
      `
        UPDATE employees
        SET
          active = FALSE,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
        RETURNING
          id,
          first_name,
          last_name,
          email,
          role,
          phone,
          department,
          active,
          created_at,
          updated_at
      `,
      [currentUser.id, employeeId],
    );

    const employee = result.rows[0];

    await createAuditLog({
      employee_id: currentUser.id,
      action: AUDIT_ACTIONS.DEACTIVATE_EMPLOYEE,
      details: `Deactivated ${employee.role} account for ${employee.email}`,
    });

    return res.json({
      message: "Employee deactivated successfully",
      employee,
    });
  } catch (err) {
    console.error("Deactivate employee error:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
};

function normalizeRequiredString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeEmail(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhoneNumber(value) {
  return /^[0-9()+\-\s.]{7,25}$/.test(value);
}

module.exports = {
  getEmployees,
  getEmployeeById,
  getTimeEntries,
  getAuditLogs,
  createEmployee,
  updateEmployee,
  activateEmployee,
  deactivateEmployee,
};
