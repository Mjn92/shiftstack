const pool = require("../config/db");

const VALID_REQUEST_TYPES = ["vacation", "personal", "sick", "other"];

const VALID_REQUEST_STATUSES = ["pending", "approved", "denied", "cancelled"];

const createPtoRequest = async (req, res) => {
  try {
    const employeeId = req.user.id;

    let { request_type, start_date, end_date, reason } = req.body;

    request_type = request_type?.trim().toLowerCase();
    reason = reason?.trim() || null;

    if (!request_type || !start_date || !end_date) {
      return res.status(400).json({
        error: "Request type, start date, and end date are required.",
      });
    }

    if (!VALID_REQUEST_TYPES.includes(request_type)) {
      return res.status(400).json({
        error: "Invalid PTO request type.",
      });
    }

    const startDate = new Date(`${start_date}T00:00:00`);

    const endDate = new Date(`${end_date}T00:00:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "Invalid PTO date.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        error: "End date cannot be before start date.",
      });
    }

    const maxEndDate = new Date(startDate);

    maxEndDate.setDate(maxEndDate.getDate() + 365);

    if (endDate > maxEndDate) {
      return res.status(400).json({
        error: "PTO request cannot exceed 365 days.",
      });
    }

    if (reason && reason.length > 1000) {
      return res.status(400).json({
        error: "Reason cannot exceed 1000 characters.",
      });
    }

    const overlappingRequest = await pool.query(
      `
        SELECT id
        FROM pto_requests
        WHERE employee_id = $1
          AND status IN ('pending', 'approved')
          AND start_date <= $3::date
          AND end_date >= $2::date
        LIMIT 1
      `,
      [employeeId, start_date, end_date],
    );

    if (overlappingRequest.rows.length > 0) {
      return res.status(409).json({
        error:
          "You already have a pending or approved PTO request for these dates.",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO pto_requests (
          employee_id,
          request_type,
          start_date,
          end_date,
          reason
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          employee_id,
          request_type,
          start_date,
          end_date,
          reason,
          status,
          created_at,
          updated_at
      `,
      [employeeId, request_type, start_date, end_date, reason],
    );

    return res.status(201).json({
      message: "PTO request submitted successfully.",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Create PTO request error:", error);

    return res.status(500).json({
      error: "Could not submit PTO request.",
    });
  }
};

/*
 * GET /api/pto/mine
 *
 * Supported query parameters:
 *
 * status=pending
 * type=vacation
 * page=1
 * limit=10
 */
const getMyPtoRequests = async (req, res) => {
  try {
    const employeeId = req.user.id;

    let { status, type, page = "1", limit = "10" } = req.query;

    status = status?.trim().toLowerCase();
    type = type?.trim().toLowerCase();

    if (status && !VALID_REQUEST_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Invalid PTO request status.",
      });
    }

    if (type && !VALID_REQUEST_TYPES.includes(type)) {
      return res.status(400).json({
        error: "Invalid PTO request type.",
      });
    }

    const parsedPage = Number.parseInt(page, 10);

    const parsedLimit = Number.parseInt(limit, 10);

    const safePage =
      Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const safeLimit = Math.min(
      Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10,
      50,
    );

    const offset = (safePage - 1) * safeLimit;

    const values = [employeeId];

    const conditions = ["employee_id = $1"];

    if (status) {
      values.push(status);

      conditions.push(`status = $${values.length}`);
    }

    if (type) {
      values.push(type);

      conditions.push(`request_type = $${values.length}`);
    }

    const whereClause = conditions.join(" AND ");

    const countResult = await pool.query(
      `
        SELECT
          COUNT(*)::integer AS total
        FROM pto_requests
        WHERE ${whereClause}
      `,
      values,
    );

    const total = Number(countResult.rows[0]?.total || 0);

    const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

    const requestValues = [...values, safeLimit, offset];

    const limitParameter = `$${values.length + 1}`;

    const offsetParameter = `$${values.length + 2}`;

    const result = await pool.query(
      `
        SELECT
          id,
          request_type,
          start_date,
          end_date,
          reason,
          status,
          reviewed_by,
          reviewed_at,
          review_note,
          created_at,
          updated_at
        FROM pto_requests
        WHERE ${whereClause}
        ORDER BY
          start_date DESC,
          created_at DESC
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter}
      `,
      requestValues,
    );

    return res.json({
      requests: result.rows,

      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: totalPages,

        has_previous_page: safePage > 1,

        has_next_page: safePage < totalPages,
      },

      filters: {
        status: status || null,
        type: type || null,
      },
    });
  } catch (error) {
    console.error("Get PTO requests error:", error);

    return res.status(500).json({
      error: "Could not load PTO requests.",
    });
  }
};

const getMyPtoRequestById = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const requestId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({
        error: "Invalid PTO request ID.",
      });
    }

    const result = await pool.query(
      `
        SELECT
          id,
          request_type,
          start_date,
          end_date,
          reason,
          status,
          reviewed_by,
          reviewed_at,
          review_note,
          created_at,
          updated_at
        FROM pto_requests
        WHERE id = $1
          AND employee_id = $2
        LIMIT 1
      `,
      [requestId, employeeId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "PTO request not found.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Get PTO request error:", error);

    return res.status(500).json({
      error: "Could not load PTO request.",
    });
  }
};

const getMyPtoBalance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `
        SELECT
          vacation_minutes,
          sick_minutes,
          personal_minutes,
          updated_at
        FROM pto_balances
        WHERE employee_id = $1
      `,
      [employeeId],
    );

    if (result.rows.length === 0) {
      return res.json({
        vacation_minutes: 0,
        vacation_hours: 0,

        sick_minutes: 0,
        sick_hours: 0,

        personal_minutes: 0,
        personal_hours: 0,

        updated_at: null,
      });
    }

    const balance = result.rows[0];

    const vacationMinutes = Number(balance.vacation_minutes || 0);

    const sickMinutes = Number(balance.sick_minutes || 0);

    const personalMinutes = Number(balance.personal_minutes || 0);

    return res.json({
      vacation_minutes: vacationMinutes,

      vacation_hours: minutesToHours(vacationMinutes),

      sick_minutes: sickMinutes,

      sick_hours: minutesToHours(sickMinutes),

      personal_minutes: personalMinutes,

      personal_hours: minutesToHours(personalMinutes),

      updated_at: balance.updated_at,
    });
  } catch (error) {
    console.error("Get PTO balance error:", error);

    return res.status(500).json({
      error: "Could not load PTO balance.",
    });
  }
};

/*
 * PATCH /api/pto/:id/cancel
 *
 * Employees may cancel only their own
 * pending PTO requests.
 */
const cancelPtoRequest = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const requestId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({
        error: "Invalid PTO request ID.",
      });
    }

    const result = await pool.query(
      `
        UPDATE pto_requests

        SET
          status = 'cancelled',
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $1
          AND employee_id = $2
          AND status = 'pending'

        RETURNING
          id,
          employee_id,
          request_type,
          start_date,
          end_date,
          reason,
          status,
          reviewed_at,
          review_note,
          created_at,
          updated_at
      `,
      [requestId, employeeId],
    );

    if (result.rows.length === 0) {
      /*
       * We intentionally don't reveal whether
       * another employee owns the request.
       */
      return res.status(404).json({
        error: "Pending PTO request not found.",
      });
    }

    return res.json({
      message: "PTO request cancelled successfully.",

      request: result.rows[0],
    });
  } catch (error) {
    console.error("Cancel PTO request error:", error);

    return res.status(500).json({
      error: "Could not cancel PTO request.",
    });
  }
};

function minutesToHours(minutes) {
  const numericMinutes = Number(minutes) || 0;

  return Number((numericMinutes / 60).toFixed(2));
}

module.exports = {
  createPtoRequest,
  getMyPtoRequests,
  getMyPtoRequestById,
  getMyPtoBalance,
  cancelPtoRequest,
};
