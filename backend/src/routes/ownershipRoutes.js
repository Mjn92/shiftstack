const requireOwnership = require("../middleware/ownershipMiddleware");
const { getEmployeeTimeEntries } = require("../controllers/timeController");

router.get(
  "/employee/:employeeId",
  protect,
  authorize("employee", "manager", "admin"),
  requireOwnership("params", "employeeId"),
  getEmployeeTimeEntries,
);
