const express = require("express");

const router = express.Router();

const { getDocuments } = require("../controllers/documentController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get(
  "/",
  protect,
  authorize("employee", "manager", "admin"),
  getDocuments,
);

module.exports = router;
