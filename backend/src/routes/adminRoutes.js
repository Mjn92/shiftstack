const express = require("express");
const router = express.Router();

const { getEmployees } = require("../controllers/employeeController");

const { protect, requireRole } = require("../middleware/authMiddleware");

router.get(
  "/employees",
  protect,
  requireRole("admin", "manager"),
  getEmployees,
);

module.exports = router;
