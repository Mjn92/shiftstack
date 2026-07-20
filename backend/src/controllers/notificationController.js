const pool = require("../config/db");

const getMyNotifications = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `SELECT id, title, message, type, read, created_at
       FROM notifications
       WHERE employee_id = $1
       ORDER BY created_at DESC`,
      [employeeId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE id = $1 AND employee_id = $2
       RETURNING id, title, message, type, read, created_at`,
      [id, employeeId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const employeeId = req.user.id;

    await pool.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE employee_id = $1`,
      [employeeId],
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const createNotification = async ({ employee_id, title, message, type }) => {
  try {
    await pool.query(
      `INSERT INTO notifications (employee_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [employee_id, title, message, type || "info"],
    );
  } catch (err) {
    console.error("Create notification error:", err);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
};
