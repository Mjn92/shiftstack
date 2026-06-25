const express = require("express");
const router = express.Router();

const {
  getEmployees,
  getTimeEntries,
  getAuditLogs,
} = require("../controllers/employeeController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get("/employees", protect, authorize("admin", "manager"), getEmployees);

router.get(
  "/time-entries",
  protect,
  authorize("admin", "manager"),
  getTimeEntries,
);

router.get("/audit-logs", protect, authorize("admin"), getAuditLogs);

module.exports = router;
