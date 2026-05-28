const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "ShiftStack API Running",
  });
});

module.exports = router;
