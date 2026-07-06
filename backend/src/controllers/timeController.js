const pool = require("../config/db");
const { sendToQueue } = require("../services/queueService");

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

    await sendToQueue("clock_in_queue", {
      type: "clock_in",
      employee_id: employeeId,
      timestamp: new Date().toISOString(),
    });

    res.status(202).json({
      message: "Clock-in request accepted",
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

    await sendToQueue("clock_out_queue", {
      type: "clock_out",
      employee_id: employeeId,
      timestamp: new Date().toISOString(),
    });

    res.status(202).json({
      message: "Clock-out request accepted",
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

const getMyWeeklySummary = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS total_shifts,
        COALESCE(SUM(total_minutes), 0) AS total_minutes
      FROM time_entries
      WHERE employee_id = $1
        AND status = 'closed'
        AND clock_in >= date_trunc('week', CURRENT_DATE)
        AND clock_in < date_trunc('week', CURRENT_DATE) + interval '7 days'
      `,
      [employeeId],
    );

    const totalMinutes = Number(result.rows[0].total_minutes || 0);
    const totalHours = Number((totalMinutes / 60).toFixed(2));
    const overtimeHours = Math.max(0, Number((totalHours - 40).toFixed(2)));

    res.json({
      total_shifts: Number(result.rows[0].total_shifts || 0),
      total_minutes: totalMinutes,
      total_hours: totalHours,
      overtime_hours: overtimeHours,
      week_start: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Weekly summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getStatus,
  getMyEntries,
  getMyWeeklySummary,
};
