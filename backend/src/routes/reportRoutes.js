const express = require("express");
const router = express.Router();

const {
  getWeeklyReport,
  exportWeeklyReportCsv,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get("/weekly", protect, authorize("manager", "admin"), getWeeklyReport);

router.get(
  "/weekly/export",
  protect,
  authorize("manager", "admin"),
  exportWeeklyReportCsv,
);

module.exports = router;
