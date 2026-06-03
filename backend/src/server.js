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

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(cors());
app.use(express.json());

app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many login attempts. Please try again later.",
  },
});

app.use("/api/auth/login", loginLimiter);

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
