require("dotenv").config();
require("./config/db");

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const timeRoutes = require("./routes/timeRoutes");
const { connectRabbitMQ } = require("./config/rabbitmq");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ShiftStack Backend Running");
});

app.use("/api/health", healthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/time", timeRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
