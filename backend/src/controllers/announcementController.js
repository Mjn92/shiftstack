const pool = require("../config/db");

const VALID_PRIORITIES = ["normal", "important", "urgent"];

const VALID_CATEGORIES = [
  "general",
  "policy",
  "schedule",
  "benefits",
  "event",
  "emergency",
];

const getAnnouncements = async (req, res) => {
  try {
    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim().toLowerCase()
        : "all";

    const priority =
      typeof req.query.priority === "string"
        ? req.query.priority.trim().toLowerCase()
        : "all";

    const requestedLimit = Number(req.query.limit);

    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : null;

    if (category !== "all" && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: "Invalid announcement category.",
      });
    }

    if (priority !== "all" && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: "priority must be normal, important, or urgent.",
      });
    }

    const values = [];

    const conditions = [
      "published = TRUE",
      "(publish_at IS NULL OR publish_at <= NOW())",
      "(expires_at IS NULL OR expires_at > NOW())",
    ];

    if (category !== "all") {
      values.push(category);

      conditions.push(`category = $${values.length}`);
    }

    if (priority !== "all") {
      values.push(priority);

      conditions.push(`priority = $${values.length}`);
    }

    const whereClause = conditions.join(" AND ");

    let limitClause = "";

    if (limit) {
      values.push(limit);

      limitClause = `LIMIT $${values.length}`;
    }

    const result = await pool.query(
      `
        SELECT
          id,
          title,
          message,
          category,
          priority,
          publish_at,
          expires_at,
          created_at

        FROM announcements

        WHERE ${whereClause}

        ORDER BY
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'important' THEN 2
            ELSE 3
          END,

          COALESCE(
            publish_at,
            created_at
          ) DESC

        ${limitClause}
      `,
      values,
    );

    return res.json({
      announcements: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error("Get announcements error:", err);

    return res.status(500).json({
      error: "Could not load company announcements.",
    });
  }
};

module.exports = {
  getAnnouncements,
};
