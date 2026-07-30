const express = require("express");

const { getAnnouncements } = require("../controllers/announcementController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAnnouncements);

module.exports = router;
