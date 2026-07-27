const express = require("express");

const router = express.Router();

const { getDocuments } = require("../controllers/documentController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, getDocuments);

module.exports = router;
