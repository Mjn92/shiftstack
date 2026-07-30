const express = require("express");

const { getManagerOverview } = require("../controllers/managerController");

const { protect, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(requireRole("manager", "admin"));

router.get("/overview", getManagerOverview);

module.exports = router;
