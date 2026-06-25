const { createAuditLog } = require("../services/auditLogService");

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        await createAuditLog({
          employee_id: req.user.id,
          action: "ACCESS_DENIED",
          details: `Denied access to ${req.method} ${req.originalUrl}`,
        });

        return res.status(403).json({
          error:
            "Access denied. You do not have permission to perform this action.",
        });
      }

      next();
    } catch (err) {
      console.error("Authorization middleware error:", err);

      return res.status(500).json({
        error: "Server error",
      });
    }
  };
};

module.exports = authorize;
