const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationRead);
router.patch("/read-all", protect, markAllNotificationsRead);

module.exports = router;
