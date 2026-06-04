const express = require("express");
const router = express.Router();

const {
  getWeeklyReport,
  exportWeeklyReportCsv,
} = require("../controllers/reportController");

const { protect, requireRole } = require("../middleware/authMiddleware");

router.get(
  "/weekly",
  protect,
  requireRole("admin", "manager"),
  getWeeklyReport,
);

router.get(
  "/weekly/export",
  protect,
  requireRole("admin", "manager"),
  exportWeeklyReportCsv,
);

module.exports = router;
