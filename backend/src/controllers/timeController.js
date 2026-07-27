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

    let weekStart = req.query.week_start;

    if (weekStart) {
      if (!isValidDateString(weekStart)) {
        return res.status(400).json({
          error: "week_start must use YYYY-MM-DD format.",
        });
      }

      if (!isMondayDate(weekStart)) {
        return res.status(400).json({
          error: "week_start must be a Monday.",
        });
      }
    } else {
      weekStart = getCurrentMondayDate();
    }

    const currentMonday = getCurrentMondayDate();

    if (weekStart > currentMonday) {
      return res.status(400).json({
        error: "Future weeks are not available.",
      });
    }

    const weekEndExclusive = addDaysToDateString(weekStart, 7);
    const weekEndInclusive = addDaysToDateString(weekStart, 6);

    const summaryQuery = `
      SELECT
        COUNT(*)::integer AS total_shifts,

        COALESCE(
          SUM(total_minutes),
          0
        )::integer AS total_minutes,

        COALESCE(
          AVG(total_minutes),
          0
        )::numeric AS average_shift_minutes,

        COALESCE(
          MAX(total_minutes),
          0
        )::integer AS longest_shift_minutes

      FROM time_entries
      WHERE employee_id = $1
        AND status = 'closed'
        AND clock_out IS NOT NULL
        AND clock_in >= $2::date
        AND clock_in < $3::date
    `;

    const dailyQuery = `
      WITH week_days AS (
        SELECT generate_series(
          $2::date,
          $3::date - INTERVAL '1 day',
          INTERVAL '1 day'
        )::date AS work_date
      ),

      daily_entries AS (
        SELECT
          clock_in::date AS work_date,
          COUNT(*)::integer AS shift_count,
          COALESCE(SUM(total_minutes), 0)::integer AS total_minutes

        FROM time_entries
        WHERE employee_id = $1
          AND status = 'closed'
          AND clock_out IS NOT NULL
          AND clock_in >= $2::date
          AND clock_in < $3::date

        GROUP BY clock_in::date
      )

      SELECT
        TO_CHAR(week_days.work_date, 'YYYY-MM-DD') AS date,
        TO_CHAR(week_days.work_date, 'FMDay') AS day_name,
        COALESCE(daily_entries.shift_count, 0)::integer AS shift_count,
        COALESCE(daily_entries.total_minutes, 0)::integer AS total_minutes

      FROM week_days
      LEFT JOIN daily_entries
        ON daily_entries.work_date = week_days.work_date

      ORDER BY week_days.work_date ASC
    `;

    const queryValues = [employeeId, weekStart, weekEndExclusive];

    const [summaryResult, dailyResult] = await Promise.all([
      pool.query(summaryQuery, queryValues),
      pool.query(dailyQuery, queryValues),
    ]);

    const row = summaryResult.rows[0] || {};

    const totalMinutes = Number(row.total_minutes || 0);
    const regularMinutes = Math.min(totalMinutes, 40 * 60);
    const overtimeMinutes = Math.max(totalMinutes - 40 * 60, 0);

    const averageShiftMinutes = Number(
      Number(row.average_shift_minutes || 0).toFixed(2),
    );

    const longestShiftMinutes = Number(row.longest_shift_minutes || 0);

    const dailyBreakdown = dailyResult.rows.map((day) => {
      const dailyMinutes = Number(day.total_minutes || 0);

      return {
        date: day.date,
        day_name: day.day_name,
        shift_count: Number(day.shift_count || 0),
        total_minutes: dailyMinutes,
        total_hours: minutesToHours(dailyMinutes),
      };
    });

    return res.json({
      week_start: weekStart,
      week_end: weekEndInclusive,
      is_current_week: weekStart === currentMonday,

      total_shifts: Number(row.total_shifts || 0),

      total_minutes: totalMinutes,
      total_hours: minutesToHours(totalMinutes),

      regular_minutes: regularMinutes,
      regular_hours: minutesToHours(regularMinutes),

      overtime_minutes: overtimeMinutes,
      overtime_hours: minutesToHours(overtimeMinutes),

      average_shift_minutes: averageShiftMinutes,
      average_shift_hours: minutesToHours(averageShiftMinutes),

      longest_shift_minutes: longestShiftMinutes,
      longest_shift_hours: minutesToHours(longestShiftMinutes),

      daily_breakdown: dailyBreakdown,
    });
  } catch (err) {
    console.error("Weekly summary error:", err);

    return res.status(500).json({
      error: "Could not load weekly summary.",
    });
  }
};

const updateMyEntryNote = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const entryId = Number(req.params.id);

    let { note } = req.body;

    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({
        error: "Invalid time entry ID.",
      });
    }

    if (typeof note !== "string") {
      return res.status(400).json({
        error: "Note must be text.",
      });
    }

    note = note.trim();

    if (note.length > 1000) {
      return res.status(400).json({
        error: "Shift note cannot exceed 1000 characters.",
      });
    }

    const result = await pool.query(
      `
        UPDATE time_entries
        SET note = $1
        WHERE id = $2
          AND employee_id = $3
        RETURNING
          id,
          clock_in,
          clock_out,
          total_minutes,
          status,
          note,
          created_at
      `,
      [note || null, entryId, employeeId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Time entry not found.",
      });
    }

    return res.status(200).json({
      message: note
        ? "Shift note updated successfully."
        : "Shift note cleared successfully.",
      entry: result.rows[0],
    });
  } catch (error) {
    console.error("Update shift note error:", error);

    return res.status(500).json({
      error: "Unable to update shift note.",
    });
  }
};

function getCurrentMondayDate() {
  const now = new Date();

  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const utcDay = now.getUTCDay();

  const daysSinceMonday = utcDay === 0 ? 6 : utcDay - 1;

  const monday = new Date(
    Date.UTC(utcYear, utcMonth, utcDate - daysSinceMonday),
  );

  return monday.toISOString().slice(0, 10);
}

function isMondayDate(value) {
  const date = new Date(`${value}T00:00:00Z`);

  return date.getUTCDay() === 1;
}

function addDaysToDateString(value, days) {
  const date = new Date(`${value}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function minutesToHours(minutes) {
  const numericMinutes = Number(minutes) || 0;

  return Number((numericMinutes / 60).toFixed(2));
}

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
  updateMyEntryNote,
};
