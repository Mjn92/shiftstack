const express = require("express");

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

const router = express.Router();

router.get(
  "/employees",
  protect,
  requireRole("admin", "manager"),
  getEmployees,
);

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

router.get(
  "/time-entries",
  protect,
  requireRole("admin", "manager"),
  getTimeEntries,
);

router.get("/audit-logs", protect, requireRole("admin"), getAuditLogs);

module.exports = router;
