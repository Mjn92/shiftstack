const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  createPtoRequest,
  getMyPtoRequests,
  getMyPtoRequestById,
  getMyPtoBalance,
  cancelPtoRequest,
} = require("../controllers/ptoController");

router.use(protect);

router.post("/", createPtoRequest);

router.get("/mine", getMyPtoRequests);

router.get("/balance", getMyPtoBalance);

router.patch("/:id/cancel", cancelPtoRequest);

router.get("/:id", getMyPtoRequestById);

module.exports = router;
