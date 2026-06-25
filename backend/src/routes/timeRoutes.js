const express = require("express");
const router = express.Router();

const {
  clockIn,
  clockOut,
  getStatus,
  getMyEntries,
} = require("../controllers/timeController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

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

module.exports = router;
