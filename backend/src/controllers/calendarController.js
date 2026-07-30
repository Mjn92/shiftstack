const pool = require("../config/db");

exports.getMyCalendar = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: "start_date and end_date are required",
      });
    }

    const startDate = new Date(`${start_date}T00:00:00`);
    const endDate = new Date(`${end_date}T00:00:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date range",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        error: "start_date cannot be after end_date",
      });
    }

    // Prevent extremely large calendar queries.
    const maxRangeMs = 93 * 24 * 60 * 60 * 1000;

    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      return res.status(400).json({
        error: "Calendar range cannot exceed 93 days",
      });
    }

    const timeResult = await pool.query(
      `
        SELECT
          id,
          clock_in,
          clock_out,
          total_minutes,
          status,
          note
        FROM time_entries
        WHERE employee_id = $1
          AND clock_in >= $2::date
          AND clock_in < ($3::date + INTERVAL '1 day')
        ORDER BY clock_in ASC
      `,
      [employeeId, start_date, end_date],
    );

    const ptoResult = await pool.query(
      `
        SELECT
          id,
          request_type,
          start_date,
          end_date,
          status
        FROM pto_requests
        WHERE employee_id = $1
          AND status IN ('pending', 'approved')
          AND start_date <= $3::date
          AND end_date >= $2::date
        ORDER BY start_date ASC
      `,
      [employeeId, start_date, end_date],
    );

    const shiftEvents = timeResult.rows.map((entry) => ({
      id: `shift-${entry.id}`,
      source_id: entry.id,
      type: "shift",
      title:
        entry.status === "open"
          ? "Active Shift"
          : formatMinutes(entry.total_minutes),
      start_date: entry.clock_in,
      end_date: entry.clock_out,
      status: entry.status,
      total_minutes: entry.total_minutes,
      note: entry.note,
    }));

    const ptoEvents = ptoResult.rows.map((request) => ({
      id: `pto-${request.id}`,
      source_id: request.id,
      type: "pto",
      title: formatPtoType(request.request_type),
      start_date: request.start_date,
      end_date: request.end_date,
      status: request.status,
    }));

    const events = [...shiftEvents, ...ptoEvents].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date),
    );

    return res.status(200).json({
      start_date,
      end_date,
      events,
    });
  } catch (error) {
    console.error("Get calendar error:", error);

    return res.status(500).json({
      error: "Failed to load calendar",
    });
  }
};

function formatMinutes(minutes) {
  const safeMinutes = Number(minutes) || 0;

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${hours}h ${remainingMinutes}m Shift`;
}

function formatPtoType(type) {
  if (!type) {
    return "PTO";
  }

  return `${type.charAt(0).toUpperCase()}${type.slice(1)} PTO`;
}
