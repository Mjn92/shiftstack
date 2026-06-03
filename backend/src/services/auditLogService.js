const pool = require("../config/db");

const createAuditLog = async ({ employee_id, action, details }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (employee_id, action, details)
       VALUES ($1, $2, $3)`,
      [employee_id || null, action, details || null],
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

module.exports = {
  createAuditLog,
};
