const express = require("express");

const {
  clockIn,
  clockOut,
  getStatus,
  getMyEntries,
  getMyWeeklySummary,
  updateMyEntryNote,
} = require("../controllers/timeController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/clock-in",
  protect,
  authorize("employee", "manager", "admin"),
  clockIn,
);

router.post(
  "/clock-out",
  protect,
  authorize("employee", "manager", "admin"),
  clockOut,
);

router.get(
  "/status",
  protect,
  authorize("employee", "manager", "admin"),
  getStatus,
);

router.get(
  "/my-entries",
  protect,
  authorize("employee", "manager", "admin"),
  getMyEntries,
);

router.get(
  "/my-weekly-summary",
  protect,
  authorize("employee", "manager", "admin"),
  getMyWeeklySummary,
);

router.patch(
  "/my-entries/:id/note",
  protect,
  authorize("employee", "manager", "admin"),
  updateMyEntryNote,
);

module.exports = router;
