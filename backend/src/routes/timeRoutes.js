const express = require("express");
const router = express.Router();

const {
  clockIn,
  clockOut,
  getStatus,
  getMyEntries,
} = require("../controllers/timeController");

const { protect } = require("../middleware/authMiddleware");

router.post("/clock-in", protect, clockIn);
router.post("/clock-out", protect, clockOut);
router.get("/status", protect, getStatus);
router.get("/my-entries", protect, getMyEntries);

module.exports = router;
