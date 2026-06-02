const pool = require("../config/db");

const getEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, role FROM employees",
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

module.exports = {
  getEmployees,
  getTimeEntries,
};
