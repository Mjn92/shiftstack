const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { canManageUser } = require("../utils/permissions");
const { createAuditLog } = require("../services/auditLogService");

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
  res.status(501).json({
    message: "Create employee endpoint planned for Day 14",
  });
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
