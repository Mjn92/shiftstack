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
      // Active/inactive employee accounts
      pool.query(`
        SELECT
          COUNT(*) FILTER (
            WHERE active = TRUE
          )::integer AS active,

          COUNT(*) FILTER (
            WHERE active = FALSE
          )::integer AS inactive

        FROM employees
        WHERE role = 'employee'
      `),

      // Active employees currently clocked in
      pool.query(`
        SELECT
          COUNT(DISTINCT t.employee_id)::integer AS count

        FROM time_entries t

        JOIN employees e
          ON e.id = t.employee_id

        WHERE t.status = 'open'
          AND e.active = TRUE
          AND e.role = 'employee'
      `),

      // Pending PTO requests from employees
      pool.query(`
        SELECT
          COUNT(*)::integer AS count

        FROM pto_requests p

        JOIN employees e
          ON e.id = p.employee_id

        WHERE p.status = 'pending'
          AND e.active = TRUE
          AND e.role = 'employee'
      `),

      // Completed employee hours for the current week
      pool.query(`
        SELECT
          COALESCE(
            SUM(t.total_minutes),
            0
          )::integer AS total_minutes

        FROM time_entries t

        JOIN employees e
          ON e.id = t.employee_id

        WHERE t.status = 'closed'
          AND t.clock_in >= DATE_TRUNC(
            'week',
            CURRENT_DATE
          )
          AND e.active = TRUE
          AND e.role = 'employee'
      `),

      // First five employees currently working
      pool.query(`
        SELECT
          e.id,
          e.first_name,
          e.last_name,
          e.email,
          e.department,

          te.id AS time_entry_id,
          te.clock_in

        FROM employees e

        JOIN LATERAL (
          SELECT
            id,
            clock_in

          FROM time_entries

          WHERE employee_id = e.id
            AND status = 'open'

          ORDER BY clock_in DESC
          LIMIT 1
        ) te ON TRUE

        WHERE e.active = TRUE
          AND e.role = 'employee'

        ORDER BY te.clock_in ASC
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
          e.last_name,
          e.email,
          e.department

        FROM pto_requests p

        JOIN employees e
          ON e.id = p.employee_id

        WHERE p.status = 'pending'
          AND e.active = TRUE
          AND e.role = 'employee'

        ORDER BY p.created_at DESC
        LIMIT 5
      `),

      // Recent employee clock activity
      pool.query(`
        SELECT
          t.id,
          t.employee_id,
          t.clock_in,
          t.clock_out,
          t.total_minutes,
          t.status,

          e.first_name,
          e.last_name,
          e.department

        FROM time_entries t

        JOIN employees e
          ON e.id = t.employee_id

        WHERE e.role = 'employee'

        ORDER BY
          COALESCE(
            t.clock_out,
            t.clock_in
          ) DESC

        LIMIT 5
      `),
    ]);

    const employees = employeeResult.rows[0] || {};

    const totalMinutes = Number(weeklyHoursResult.rows[0]?.total_minutes || 0);

    return res.json({
      employees: {
        active: Number(employees.active || 0),
        inactive: Number(employees.inactive || 0),
      },

      attendance: {
        working_now: Number(workingResult.rows[0]?.count || 0),
      },

      pto: {
        pending: Number(pendingPtoResult.rows[0]?.count || 0),
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

const getAttendance = async (req, res) => {
  try {
    const search = normalizeQueryString(req.query.search, "");

    const department = normalizeQueryString(req.query.department, "all");

    const status = normalizeQueryString(req.query.status, "all");

    const parsedPage = parsePositiveInteger(req.query.page, 1);

    const parsedLimit = Math.min(
      parsePositiveInteger(req.query.limit, 20),
      100,
    );

    const allowedStatuses = ["all", "working", "clocked_out"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "status must be all, working, or clocked_out.",
      });
    }

    if (search.length > 100) {
      return res.status(400).json({
        error: "Search must be 100 characters or fewer.",
      });
    }

    if (department.length > 100) {
      return res.status(400).json({
        error: "Department must be 100 characters or fewer.",
      });
    }

    const conditions = ["e.active = TRUE", "e.role = 'employee'"];

    const values = [];

    if (search) {
      values.push(`%${search}%`);

      const searchParameter = `$${values.length}`;

      conditions.push(`
        (
          e.first_name ILIKE ${searchParameter}
          OR e.last_name ILIKE ${searchParameter}
          OR e.email ILIKE ${searchParameter}
          OR CONCAT(
            e.first_name,
            ' ',
            e.last_name
          ) ILIKE ${searchParameter}
        )
      `);
    }

    if (department !== "all") {
      values.push(department);

      conditions.push(`e.department = $${values.length}`);
    }

    if (status === "working") {
      conditions.push("te.id IS NOT NULL");
    }

    if (status === "clocked_out") {
      conditions.push("te.id IS NULL");
    }

    const whereClause = conditions.join(" AND ");

    const offset = (parsedPage - 1) * parsedLimit;

    const countValues = [...values];

    const countQuery = `
      SELECT
        COUNT(*)::integer AS total

      FROM employees e

      LEFT JOIN LATERAL (
        SELECT
          id

        FROM time_entries

        WHERE employee_id = e.id
          AND status = 'open'

        ORDER BY clock_in DESC
        LIMIT 1
      ) te ON TRUE

      WHERE ${whereClause}
    `;

    values.push(parsedLimit);
    const limitParameter = `$${values.length}`;

    values.push(offset);
    const offsetParameter = `$${values.length}`;

    const attendanceQuery = `
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.email,
        e.department,

        te.id AS time_entry_id,
        te.clock_in,

        CASE
          WHEN te.id IS NOT NULL
            THEN 'working'
          ELSE 'clocked_out'
        END AS attendance_status

      FROM employees e

      LEFT JOIN LATERAL (
        SELECT
          id,
          clock_in

        FROM time_entries

        WHERE employee_id = e.id
          AND status = 'open'

        ORDER BY clock_in DESC
        LIMIT 1
      ) te ON TRUE

      WHERE ${whereClause}

      ORDER BY
        CASE
          WHEN te.id IS NOT NULL
            THEN 0
          ELSE 1
        END,
        e.last_name ASC,
        e.first_name ASC

      LIMIT ${limitParameter}
      OFFSET ${offsetParameter}
    `;

    const summaryQuery = `
      SELECT
        COUNT(*)::integer
          AS active_employees,

        COUNT(*) FILTER (
          WHERE te.id IS NOT NULL
        )::integer
          AS working_now

      FROM employees e

      LEFT JOIN LATERAL (
        SELECT
          id

        FROM time_entries

        WHERE employee_id = e.id
          AND status = 'open'

        ORDER BY clock_in DESC
        LIMIT 1
      ) te ON TRUE

      WHERE e.active = TRUE
        AND e.role = 'employee'
    `;

    const [attendanceResult, countResult, summaryResult] = await Promise.all([
      pool.query(attendanceQuery, values),

      pool.query(countQuery, countValues),

      pool.query(summaryQuery),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    const totalPages = total === 0 ? 0 : Math.ceil(total / parsedLimit);

    const summary = summaryResult.rows[0] || {};

    const activeEmployees = Number(summary.active_employees || 0);

    const workingNow = Number(summary.working_now || 0);

    return res.json({
      employees: attendanceResult.rows,

      summary: {
        active_employees: activeEmployees,

        working_now: workingNow,

        clocked_out: Math.max(activeEmployees - workingNow, 0),
      },

      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        total_pages: totalPages,

        has_previous_page: parsedPage > 1,

        has_next_page: parsedPage < totalPages,
      },

      filters: {
        search,
        department,
        status,
      },
    });
  } catch (err) {
    console.error("Manager attendance error:", err);

    return res.status(500).json({
      error: "Could not load live attendance.",
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        TRIM(department) AS department

      FROM employees

      WHERE active = TRUE
        AND role = 'employee'
        AND department IS NOT NULL
        AND TRIM(department) <> ''

      ORDER BY department ASC
    `);

    return res.json({
      departments: result.rows.map((row) => row.department),
    });
  } catch (err) {
    console.error("Manager departments error:", err);

    return res.status(500).json({
      error: "Could not load departments.",
    });
  }
};

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }

  return number;
}

function normalizeQueryString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

module.exports = {
  getManagerOverview,
  getAttendance,
  getDepartments,
};
