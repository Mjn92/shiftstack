const pool = require("../config/db");
const { Parser } = require("json2csv");
const { createAuditLog } = require("../services/auditLogService");

const getWeeklyReport = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    if (
      req.user.role === "employee" &&
      employee_id &&
      Number(employee_id) !== req.user.id
    ) {
      await createAuditLog({
        employee_id: req.user.id,
        action: "ACCESS_DENIED",
        details: "Attempted to access another employee's report",
      });

      return res.status(403).json({
        error: "Access denied.",
      });
    }

    let query = `
      SELECT 
        employees.id AS employee_id,
        employees.first_name,
        employees.last_name,
        employees.email,
        COUNT(time_entries.id) AS total_shifts,
        COALESCE(SUM(time_entries.total_minutes), 0) AS total_minutes,
        ROUND(COALESCE(SUM(time_entries.total_minutes), 0) / 60.0, 2) AS total_hours
      FROM employees
      LEFT JOIN time_entries ON employees.id = time_entries.employee_id
      WHERE time_entries.status = 'closed'
    `;

    const values = [];
    let index = 1;

    if (employee_id) {
      query += ` AND employees.id = $${index}`;
      values.push(employee_id);
      index++;
    }

    if (start_date) {
      query += ` AND time_entries.clock_in >= $${index}`;
      values.push(start_date);
      index++;
    }

    if (end_date) {
      query += ` AND time_entries.clock_in <= $${index}`;
      values.push(end_date);
      index++;
    }

    query += `
      GROUP BY employees.id, employees.first_name, employees.last_name, employees.email
      ORDER BY employees.last_name ASC
    `;

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error("Weekly report error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const exportWeeklyReportCsv = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        employees.id AS employee_id,
        employees.first_name,
        employees.last_name,
        employees.email,
        COUNT(time_entries.id) AS total_shifts,
        COALESCE(SUM(time_entries.total_minutes), 0) AS total_minutes,
        ROUND(COALESCE(SUM(time_entries.total_minutes), 0) / 60.0, 2) AS total_hours
      FROM employees
      LEFT JOIN time_entries ON employees.id = time_entries.employee_id
      WHERE time_entries.status = 'closed'
    `;

    const values = [];
    let index = 1;

    if (employee_id) {
      query += ` AND employees.id = $${index}`;
      values.push(employee_id);
      index++;
    }

    if (start_date) {
      query += ` AND time_entries.clock_in >= $${index}`;
      values.push(start_date);
      index++;
    }

    if (end_date) {
      query += ` AND time_entries.clock_in <= $${index}`;
      values.push(end_date);
      index++;
    }

    query += `
      GROUP BY employees.id, employees.first_name, employees.last_name, employees.email
      ORDER BY employees.last_name ASC
    `;

    const result = await pool.query(query, values);

    const fields = [
      "employee_id",
      "first_name",
      "last_name",
      "email",
      "total_shifts",
      "total_minutes",
      "total_hours",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.header("Content-Type", "text/csv");
    res.attachment("weekly_report.csv");
    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getWeeklyReport,
  exportWeeklyReportCsv,
};
