const pool = require("../config/db");

const getMyNotifications = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const hasQueryOptions = ["page", "limit", "read", "type"].some(
      (key) => req.query[key] !== undefined,
    );

    // Preserve original behavior for existing consumers.
    if (!hasQueryOptions) {
      const result = await pool.query(
        `
          SELECT
            id,
            title,
            message,
            type,
            read,
            created_at
          FROM notifications
          WHERE employee_id = $1
          ORDER BY created_at DESC
        `,
        [employeeId],
      );

      return res.json(result.rows);
    }

    const page = parsePositiveInteger(req.query.page, 1);

    const requestedLimit = parsePositiveInteger(req.query.limit, 10);

    if (page === null) {
      return res.status(400).json({
        error: "page must be a positive integer.",
      });
    }

    if (requestedLimit === null) {
      return res.status(400).json({
        error: "limit must be a positive integer.",
      });
    }

    const limit = Math.min(requestedLimit, 50);

    const readFilter =
      typeof req.query.read === "string"
        ? req.query.read.trim().toLowerCase()
        : "all";

    const typeFilter =
      typeof req.query.type === "string"
        ? req.query.type.trim().toLowerCase()
        : "all";

    if (!["all", "read", "unread"].includes(readFilter)) {
      return res.status(400).json({
        error: "read must be all, read, or unread.",
      });
    }

    if (!typeFilter || typeFilter.length > 50) {
      return res.status(400).json({
        error: "Invalid notification type.",
      });
    }

    const values = [employeeId];

    const conditions = ["employee_id = $1"];

    if (readFilter === "read") {
      conditions.push("read = TRUE");
    }

    if (readFilter === "unread") {
      conditions.push("read = FALSE");
    }

    if (typeFilter !== "all") {
      values.push(typeFilter);

      conditions.push(`type = $${values.length}`);
    }

    const whereClause = conditions.join(" AND ");

    const offset = (page - 1) * limit;

    const countValues = [...values];

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM notifications
      WHERE ${whereClause}
    `;

    const unreadQuery = `
      SELECT COUNT(*)::integer AS unread_count
      FROM notifications
      WHERE employee_id = $1
        AND read = FALSE
    `;

    values.push(limit);

    const limitParameter = `$${values.length}`;

    values.push(offset);

    const offsetParameter = `$${values.length}`;

    const notificationQuery = `
      SELECT
        id,
        title,
        message,
        type,
        read,
        created_at
      FROM notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitParameter}
      OFFSET ${offsetParameter}
    `;

    const [notificationResult, countResult, unreadResult] = await Promise.all([
      pool.query(notificationQuery, values),

      pool.query(countQuery, countValues),

      pool.query(unreadQuery, [employeeId]),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return res.json({
      notifications: notificationResult.rows,

      unread_count: Number(unreadResult.rows[0]?.unread_count || 0),

      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,

        has_previous_page: page > 1,

        has_next_page: page < totalPages,
      },

      filters: {
        read: readFilter,
        type: typeFilter,
      },
    });
  } catch (err) {
    console.error("Get notifications error:", err);

    return res.status(500).json({
      error: "Could not load notifications.",
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `
            SELECT
              COUNT(*)::integer
                AS unread_count
            FROM notifications
            WHERE employee_id = $1
              AND read = FALSE
          `,
      [employeeId],
    );

    return res.json({
      unread_count: Number(result.rows[0]?.unread_count || 0),
    });
  } catch (err) {
    console.error("Get unread notification count error:", err);

    return res.status(500).json({
      error: "Could not load unread notification count.",
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId < 1) {
      return res.status(400).json({
        error: "Invalid notification ID.",
      });
    }

    const result = await pool.query(
      `
            UPDATE notifications
            SET read = TRUE
            WHERE id = $1
              AND employee_id = $2
            RETURNING
              id,
              title,
              message,
              type,
              read,
              created_at
          `,
      [notificationId, employeeId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Notification not found.",
      });
    }

    return res.json({
      message: "Notification marked as read",

      notification: result.rows[0],
    });
  } catch (err) {
    console.error("Mark notification read error:", err);

    return res.status(500).json({
      error: "Could not update notification.",
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `
            UPDATE notifications
            SET read = TRUE
            WHERE employee_id = $1
              AND read = FALSE
            RETURNING id
          `,
      [employeeId],
    );

    return res.json({
      message: "All notifications marked as read",

      updated_count: result.rows.length,
    });
  } catch (err) {
    console.error("Mark all notifications read error:", err);

    return res.status(500).json({
      error: "Could not update notifications.",
    });
  }
};

const createNotification = async ({ employee_id, title, message, type }) => {
  try {
    if (!employee_id || !title || !message) {
      throw new Error("employee_id, title, and message are required");
    }

    const result = await pool.query(
      `
          INSERT INTO notifications (
            employee_id,
            title,
            message,
            type
          )
          VALUES ($1, $2, $3, $4)
          RETURNING
            id,
            employee_id,
            title,
            message,
            type,
            read,
            created_at
        `,
      [
        employee_id,
        title.trim(),
        message.trim(),
        typeof type === "string" && type.trim()
          ? type.trim().toLowerCase()
          : "info",
      ],
    );

    return result.rows[0];
  } catch (err) {
    console.error("Create notification error:", err);

    return null;
  }
};

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
}

module.exports = {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
};
