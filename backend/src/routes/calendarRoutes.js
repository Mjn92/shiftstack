const express = require("express");

const router = express.Router();

const { getMyCalendar } = require("../controllers/calendarController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyCalendar);

module.exports = router;
