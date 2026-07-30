const pool = require("../config/db");

const getManagerOverview = async (req, res) => {
  try {
    const [
      employeeResult,
      workingResult,
      pendingPtoResult,
      weeklyHoursResult,
      workingEmployeesResult,
      pendingRequestsResult,
      recentActivityResult,
    ] = await Promise.all([
      // Active employees
      pool.query(`
        SELECT COUNT(*)::integer AS count
        FROM employees
        WHERE active = TRUE
          AND role = 'employee'
      `),

      // Employees currently clocked in
      pool.query(`
        SELECT COUNT(DISTINCT employee_id)::integer AS count
        FROM time_entries
        WHERE status = 'open'
      `),

      // Pending PTO requests
      pool.query(`
        SELECT COUNT(*)::integer AS count
        FROM pto_requests
        WHERE status = 'pending'
      `),

      // Total completed hours for the current week
      pool.query(`
        SELECT
          COALESCE(SUM(total_minutes), 0)::integer AS total_minutes
        FROM time_entries
        WHERE status = 'closed'
          AND clock_in >= DATE_TRUNC('week', CURRENT_DATE)
      `),

      // Employees currently working
      pool.query(`
        SELECT
          e.id,
          e.first_name,
          e.last_name,
          e.department,
          t.clock_in
        FROM time_entries t
        JOIN employees e
          ON e.id = t.employee_id
        WHERE t.status = 'open'
          AND e.active = TRUE
        ORDER BY t.clock_in ASC
        LIMIT 5
      `),

      // Latest pending PTO requests
      pool.query(`
        SELECT
          p.id,
          p.employee_id,
          p.request_type,
          p.start_date,
          p.end_date,
          p.created_at,
          e.first_name,
          e.last_name
        FROM pto_requests p
        JOIN employees e
          ON e.id = p.employee_id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC
        LIMIT 5
      `),

      // Recent clock activity
      pool.query(`
        SELECT
          t.id,
          t.clock_in,
          t.clock_out,
          t.status,
          e.first_name,
          e.last_name
        FROM time_entries t
        JOIN employees e
          ON e.id = t.employee_id
        ORDER BY COALESCE(t.clock_out, t.clock_in) DESC
        LIMIT 5
      `),
    ]);

    const totalMinutes = Number(weeklyHoursResult.rows[0]?.total_minutes || 0);

    return res.json({
      employees: {
        active: employeeResult.rows[0]?.count || 0,
      },

      attendance: {
        working_now: workingResult.rows[0]?.count || 0,
      },

      pto: {
        pending: pendingPtoResult.rows[0]?.count || 0,
      },

      week: {
        total_minutes: totalMinutes,
        total_hours: Number((totalMinutes / 60).toFixed(2)),
      },

      working_employees: workingEmployeesResult.rows,
      pending_pto_requests: pendingRequestsResult.rows,
      recent_activity: recentActivityResult.rows,
    });
  } catch (err) {
    console.error("Manager overview error:", err);

    return res.status(500).json({
      error: "Could not load manager dashboard",
    });
  }
};

module.exports = {
  getManagerOverview,
};
