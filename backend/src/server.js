require("dotenv").config();
require("./config/db");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const healthRoutes = require("./routes/healthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const timeRoutes = require("./routes/timeRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { connectRabbitMQ } = require("./config/rabbitmq");

const app = express();

app.set("trust proxy", 1);

const logDirectory = path.join(__dirname, "../logs");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, "access.log"),
  { flags: "a" },
);

const errorLogStream = fs.createWriteStream(
  path.join(logDirectory, "error.log"),
  { flags: "a" },
);

const allowedOrigins = [
  "http://localhost:3000",
  "https://shiftstack-lovat.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(helmet());

app.use(
  morgan(":date[iso] :remote-addr :method :url :status :response-time ms", {
    stream: accessLogStream,
  }),
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login or registration attempts. Please try again later.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many account creation attempts. Please try again later.",
  },
});

const clockLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many clock requests. Please wait and try again.",
  },
});

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many report requests. Please wait and try again.",
  },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many admin requests. Please try again later.",
  },
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", speedLimiter);
app.use("/api", apiLimiter);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/time", clockLimiter);
app.use("/api/reports", reportLimiter);
app.use("/api/admin", adminLimiter);

app.get("/", (req, res) => {
  res.send("ShiftStack Backend Running");
});

app.use("/api/health", healthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectRabbitMQ();

    app.listen(PORT, () => {
      const startupMessage = `Server running on port ${PORT}`;

      console.log(startupMessage);

      fs.appendFileSync(
        path.join(logDirectory, "access.log"),
        `[${new Date().toISOString()}] ${startupMessage}\n`,
      );
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
};

process.on("uncaughtException", (err) => {
  fs.appendFileSync(
    path.join(logDirectory, "error.log"),
    `[${new Date().toISOString()}] ${err.stack}\n\n`,
  );

  console.error(err);
});

process.on("unhandledRejection", (reason) => {
  fs.appendFileSync(
    path.join(logDirectory, "error.log"),
    `[${new Date().toISOString()}] ${reason}\n\n`,
  );

  console.error(reason);
});

startServer();
