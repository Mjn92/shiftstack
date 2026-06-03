const express = require("express");
const router = express.Router();

const {
  getEmployees,
  getTimeEntries,
  getAuditLogs,
} = require("../controllers/employeeController");

const { protect, requireRole } = require("../middleware/authMiddleware");

router.get(
  "/employees",
  protect,
  requireRole("admin", "manager"),
  getEmployees,
);
router.get(
  "/time-entries",
  protect,
  requireRole("admin", "manager"),
  getTimeEntries,
);
router.get("/audit-logs", protect, requireRole("admin"), getAuditLogs);

module.exports = router;
