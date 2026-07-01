const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { canManageUser } = require("../utils/permissions");
const { createAuditLog } = require("../services/auditLogService");
const { AUDIT_ACTIONS } = require("../utils/auditActions");

const getEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, role FROM employees ORDER BY last_name ASC",
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
    });
  }
};

const getTimeEntries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
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
       JOIN employees ON employees.id = time_entries.employee_id
       ORDER BY time_entries.clock_in DESC`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get time entries error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        audit_logs.id,
        audit_logs.employee_id,
        employees.first_name,
        employees.last_name,
        employees.email,
        audit_logs.action,
        audit_logs.details,
        audit_logs.created_at
       FROM audit_logs
       LEFT JOIN employees ON employees.id = audit_logs.employee_id
       ORDER BY audit_logs.created_at DESC`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const createEmployee = async (req, res) => {
  try {
    const currentUser = req.user;

    const { first_name, last_name, email, password, role, phone, department } =
      req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        error: "First name, last name, email, and password are required",
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
      "SELECT id FROM employees WHERE LOWER(email) = LOWER($1)",
      [email],
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(409).json({
        error: "An employee with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO employees 
        (first_name, last_name, email, password_hash, role, phone, department, active, updated_by)
       VALUES 
        ($1, $2, LOWER($3), $4, $5, $6, $7, TRUE, $8)
       RETURNING id, first_name, last_name, email, role, phone, department, active, created_at, updated_at`,
      [
        first_name,
        last_name,
        email,
        passwordHash,
        newRole,
        phone || null,
        department || null,
        currentUser.id,
      ],
    );

    const employee = result.rows[0];

    await createAuditLog({
      employee_id: currentUser.id,
      action: AUDIT_ACTIONS.CREATE_EMPLOYEE,
      details: `Created ${employee.role} account for ${employee.email}`,
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee,
    });
  } catch (err) {
    console.error("Create employee error:", err);
    res.status(500).json({
      error: "Server error",
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const currentUser = req.user;
    const employeeId = req.params.id;

    const { first_name, last_name, email, role, phone, department, active } =
      req.body;

    const existingEmployee = await pool.query(
      "SELECT id, email, role FROM employees WHERE id = $1",
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

    const newRole = role || targetEmployee.role;

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

    if (email) {
      const duplicateEmail = await pool.query(
        "SELECT id FROM employees WHERE LOWER(email) = LOWER($1) AND id != $2",
        [email, employeeId],
      );

      if (duplicateEmail.rows.length > 0) {
        return res.status(409).json({
          error: "Another employee already uses this email",
        });
      }
    }

    const result = await pool.query(
      `UPDATE employees
       SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE(LOWER($3), email),
        role = COALESCE($4, role),
        phone = COALESCE($5, phone),
        department = COALESCE($6, department),
        active = COALESCE($7, active),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $8
       WHERE id = $9
       RETURNING id, first_name, last_name, email, role, phone, department, active, created_at, updated_at`,
      [
        first_name || null,
        last_name || null,
        email || null,
        newRole,
        phone || null,
        department || null,
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
        details: `Changed role for ${updatedEmployee.email} from ${targetEmployee.role} to ${newRole}`,
      });
    }

    res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (err) {
    console.error("Update employee error:", err);
    res.status(500).json({
      error: "Server error",
    });
  }
};

const activateEmployee = async (req, res) => {
  try {
    const currentUser = req.user;
    const employeeId = req.params.id;

    const existingEmployee = await pool.query(
      "SELECT id, email, role, active FROM employees WHERE id = $1",
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
      `UPDATE employees
       SET active = TRUE,
           updated_at = CURRENT_TIMESTAMP,
           updated_by = $1
       WHERE id = $2
       RETURNING id, first_name, last_name, email, role, phone, department, active, created_at, updated_at`,
      [currentUser.id, employeeId],
    );

    const employee = result.rows[0];

    await createAuditLog({
      employee_id: currentUser.id,
      action: AUDIT_ACTIONS.ACTIVATE_EMPLOYEE,
      details: `Activated ${employee.role} account for ${employee.email}`,
    });

    res.json({
      message: "Employee activated successfully",
      employee,
    });
  } catch (err) {
    console.error("Activate employee error:", err);
    res.status(500).json({
      error: "Server error",
    });
  }
};

const deactivateEmployee = async (req, res) => {
  try {
    const currentUser = req.user;
    const employeeId = req.params.id;

    const existingEmployee = await pool.query(
      "SELECT id, email, role, active FROM employees WHERE id = $1",
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

    if (currentUser.id === Number(employeeId)) {
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
      `UPDATE employees
       SET active = FALSE,
           updated_at = CURRENT_TIMESTAMP,
           updated_by = $1
       WHERE id = $2
       RETURNING id, first_name, last_name, email, role, phone, department, active, created_at, updated_at`,
      [currentUser.id, employeeId],
    );

    const employee = result.rows[0];

    await createAuditLog({
      employee_id: currentUser.id,
      action: AUDIT_ACTIONS.DEACTIVATE_EMPLOYEE,
      details: `Deactivated ${employee.role} account for ${employee.email}`,
    });

    res.json({
      message: "Employee deactivated successfully",
      employee,
    });
  } catch (err) {
    console.error("Deactivate employee error:", err);
    res.status(500).json({
      error: "Server error",
    });
  }
};

const getEmployeeById = async (req, res) => {
  res.status(501).json({
    message: "Get single employee endpoint planned for Day 14",
  });
};

module.exports = {
  getEmployees,
  getTimeEntries,
  getAuditLogs,
  createEmployee,
  updateEmployee,
  activateEmployee,
  deactivateEmployee,
  getEmployeeById,
};
