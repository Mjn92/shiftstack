const express = require("express");

const {
  getManagerOverview,
  getAttendance,
  getDepartments,
} = require("../controllers/managerController");

const { protect, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(requireRole("manager", "admin"));

router.get("/overview", getManagerOverview);

router.get("/attendance", getAttendance);

router.get("/departments", getDepartments);

module.exports = router;
