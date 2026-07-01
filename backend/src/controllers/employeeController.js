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
  res.status(501).json({
    message: "Update employee endpoint planned for Day 14",
  });
};

const activateEmployee = async (req, res) => {
  res.status(501).json({
    message: "Activate employee endpoint planned for Day 14",
  });
};

const deactivateEmployee = async (req, res) => {
  res.status(501).json({
    message: "Deactivate employee endpoint planned for Day 14",
  });
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
