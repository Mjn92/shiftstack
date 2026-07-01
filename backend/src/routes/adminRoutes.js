const express = require("express");
const router = express.Router();

const {
  getEmployees,
  getTimeEntries,
  getAuditLogs,
  createEmployee,
  updateEmployee,
  activateEmployee,
  deactivateEmployee,
  getEmployeeById,
} = require("../controllers/employeeController");

const { protect, requireRole } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get("/employees", protect, authorize("admin", "manager"), getEmployees);

router.get(
  "/time-entries",
  protect,
  authorize("admin", "manager"),
  getTimeEntries,
);

router.get("/audit-logs", protect, authorize("admin"), getAuditLogs);

router.get(
  "/employees/:id",
  protect,
  requireRole("admin", "manager"),
  getEmployeeById,
);

router.post(
  "/employees",
  protect,
  requireRole("admin", "manager"),
  createEmployee,
);

router.put(
  "/employees/:id",
  protect,
  requireRole("admin", "manager"),
  updateEmployee,
);

router.patch(
  "/employees/:id/activate",
  protect,
  requireRole("admin", "manager"),
  activateEmployee,
);

router.patch(
  "/employees/:id/deactivate",
  protect,
  requireRole("admin", "manager"),
  deactivateEmployee,
);

module.exports = router;
