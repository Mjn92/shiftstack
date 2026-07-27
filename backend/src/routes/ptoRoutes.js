const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createPtoRequest,
  getMyPtoRequests,
  getMyPtoRequestById,
} = require("../controllers/ptoController");

router.use(authMiddleware);

router.post("/", createPtoRequest);

router.get("/mine", getMyPtoRequests);

router.get("/:id", getMyPtoRequestById);

module.exports = router;
