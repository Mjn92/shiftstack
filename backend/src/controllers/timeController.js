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

    const hasQueryOptions = [
      "page",
      "limit",
      "start_date",
      "end_date",
      "status",
      "sort",
    ].some((key) => req.query[key] !== undefined);

    // Preserve the original response used by the dashboard.
    if (!hasQueryOptions) {
      const result = await pool.query(
        `
          SELECT
            id,
            clock_in,
            clock_out,
            total_minutes,
            status,
            note,
            created_at
          FROM time_entries
          WHERE employee_id = $1
          ORDER BY clock_in DESC
        `,
        [employeeId],
      );

      return res.json(result.rows);
    }

    const page = parsePositiveInteger(req.query.page, 1);
    const requestedLimit = parsePositiveInteger(req.query.limit, 10);
    const limit = Math.min(requestedLimit, 100);

    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;
    const status = req.query.status || "all";
    const sort = req.query.sort || "newest";

    if (startDate && !isValidDateString(startDate)) {
      return res.status(400).json({
        error: "start_date must use YYYY-MM-DD format.",
      });
    }

    if (endDate && !isValidDateString(endDate)) {
      return res.status(400).json({
        error: "end_date must use YYYY-MM-DD format.",
      });
    }

    if (
      startDate &&
      endDate &&
      new Date(`${startDate}T00:00:00Z`) > new Date(`${endDate}T00:00:00Z`)
    ) {
      return res.status(400).json({
        error: "start_date cannot be after end_date.",
      });
    }

    if (!["all", "open", "closed"].includes(status)) {
      return res.status(400).json({
        error: "status must be all, open, or closed.",
      });
    }

    if (!["newest", "oldest"].includes(sort)) {
      return res.status(400).json({
        error: "sort must be newest or oldest.",
      });
    }

    const values = [employeeId];
    const conditions = ["employee_id = $1"];

    if (startDate) {
      values.push(startDate);

      conditions.push(`clock_in >= $${values.length}::date`);
    }

    if (endDate) {
      values.push(endDate);

      // Exclusive next-day boundary includes the entire selected end date.
      conditions.push(
        `clock_in < ($${values.length}::date + INTERVAL '1 day')`,
      );
    }

    if (status !== "all") {
      values.push(status);

      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.join(" AND ");
    const orderDirection = sort === "oldest" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;

    const countValues = [...values];

    const countQuery = `
      SELECT COUNT(*)::integer AS total
      FROM time_entries
      WHERE ${whereClause}
    `;

    const summaryQuery = `
      SELECT
        COUNT(*)::integer AS total_entries,

        COUNT(*) FILTER (
          WHERE status = 'closed' AND clock_out IS NOT NULL
        )::integer AS completed_entries,

        COUNT(*) FILTER (
          WHERE status = 'open' OR clock_out IS NULL
        )::integer AS open_entries,

        COALESCE(
          SUM(total_minutes) FILTER (
            WHERE status = 'closed' AND clock_out IS NOT NULL
          ),
          0
        )::integer AS total_minutes

      FROM time_entries
      WHERE ${whereClause}
    `;

    values.push(limit);
    const limitParameter = `$${values.length}`;

    values.push(offset);
    const offsetParameter = `$${values.length}`;

    const entriesQuery = `
      SELECT
        id,
        clock_in,
        clock_out,
        total_minutes,
        status,
        note,
        created_at
      FROM time_entries
      WHERE ${whereClause}
      ORDER BY clock_in ${orderDirection}
      LIMIT ${limitParameter}
      OFFSET ${offsetParameter}
    `;

    const [entriesResult, countResult, summaryResult] = await Promise.all([
      pool.query(entriesQuery, values),
      pool.query(countQuery, countValues),
      pool.query(summaryQuery, countValues),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const summary = summaryResult.rows[0] || {};
    const totalMinutes = Number(summary.total_minutes || 0);

    return res.json({
      entries: entriesResult.rows,

      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous_page: page > 1,
        has_next_page: page < totalPages,
      },

      summary: {
        total_entries: Number(summary.total_entries || 0),
        completed_entries: Number(summary.completed_entries || 0),
        open_entries: Number(summary.open_entries || 0),
        total_minutes: totalMinutes,
        total_hours: Number((totalMinutes / 60).toFixed(2)),
      },

      filters: {
        start_date: startDate,
        end_date: endDate,
        status,
        sort,
      },
    });
  } catch (err) {
    console.error("Get entries error:", err);

    return res.status(500).json({
      error: "Could not load time entries.",
    });
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

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }

  return number;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

module.exports = {
  clockIn,
  clockOut,
  getStatus,
  getMyEntries,
  getMyWeeklySummary,
};
