const { createAuditLog } = require("../services/auditLogService");

const requireOwnership = (idSource = "params", field = "employeeId") => {
  return async (req, res, next) => {
    try {
      // Managers and Admins bypass ownership checks
      if (req.user.role === "admin" || req.user.role === "manager") {
        return next();
      }

      let requestedId;

      switch (idSource) {
        case "params":
          requestedId = Number(req.params[field]);
          break;

        case "query":
          requestedId = Number(req.query[field]);
          break;

        case "body":
          requestedId = Number(req.body[field]);
          break;

        default:
          requestedId = Number(req.params[field]);
      }

      if (requestedId !== req.user.id) {
        await createAuditLog({
          employee_id: req.user.id,
          action: "ACCESS_DENIED",
          details: `Attempted to access employee ${requestedId}`,
        });

        return res.status(403).json({
          error: "Access denied.",
        });
      }

      next();
    } catch (err) {
      console.error("Ownership middleware:", err);

      return res.status(500).json({
        error: "Server error",
      });
    }
  };
};

module.exports = requireOwnership;
