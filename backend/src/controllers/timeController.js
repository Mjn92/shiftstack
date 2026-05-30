const pool = require("../config/db");

const clockIn = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const openEntry = await pool.query(
      "SELECT id FROM time_entries WHERE employee_id = $1 AND status = 'open'",
      [employeeId],
    );

    if (openEntry.rows.length > 0) {
      return res.status(400).json({ error: "You are already clocked in" });
    }

    const result = await pool.query(
      `INSERT INTO time_entries (employee_id, clock_in, status)
       VALUES ($1, NOW(), 'open')
       RETURNING *`,
      [employeeId],
    );

    res.status(201).json({
      message: "Clocked in successfully",
      time_entry: result.rows[0],
    });
  } catch (err) {
    console.error("Clock in error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const clockOut = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const openEntry = await pool.query(
      `SELECT * FROM time_entries
       WHERE employee_id = $1 AND status = 'open'
       ORDER BY clock_in DESC
       LIMIT 1`,
      [employeeId],
    );

    if (openEntry.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "You are not currently clocked in" });
    }

    const entry = openEntry.rows[0];

    const result = await pool.query(
      `UPDATE time_entries
       SET clock_out = NOW(),
           total_minutes = FLOOR(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 60),
           status = 'closed'
       WHERE id = $1
       RETURNING *`,
      [entry.id],
    );

    res.json({
      message: "Clocked out successfully",
      time_entry: result.rows[0],
    });
  } catch (err) {
    console.error("Clock out error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM time_entries
       WHERE employee_id = $1 AND status = 'open'
       ORDER BY clock_in DESC
       LIMIT 1`,
      [employeeId],
    );

    res.json({
      clocked_in: result.rows.length > 0,
      current_entry: result.rows[0] || null,
    });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getMyEntries = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT id, clock_in, clock_out, total_minutes, status, note, created_at
       FROM time_entries
       WHERE employee_id = $1
       ORDER BY clock_in DESC`,
      [employeeId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get entries error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getStatus,
  getMyEntries,
};
