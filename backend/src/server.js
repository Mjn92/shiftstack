require("dotenv").config();
require("./config/db");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ShiftStack Backend Running");
});

const healthRoutes = require("./routes/healthRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/health", healthRoutes);
app.use("/api/admin", adminRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
