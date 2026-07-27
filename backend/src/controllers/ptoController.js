const pool = require("../config/db");

const VALID_REQUEST_TYPES = ["vacation", "personal", "sick", "other"];

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
          created_at
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

const getMyPtoRequests = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const result = await pool.query(
      `
        SELECT
          id,
          request_type,
          start_date,
          end_date,
          reason,
          status,
          reviewed_at,
          review_note,
          created_at,
          updated_at
        FROM pto_requests
        WHERE employee_id = $1
        ORDER BY start_date DESC, created_at DESC
      `,
      [employeeId],
    );

    return res.json(result.rows);
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

module.exports = {
  createPtoRequest,
  getMyPtoRequests,
  getMyPtoRequestById,
};
