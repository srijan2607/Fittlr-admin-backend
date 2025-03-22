// app.js

require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const cloudflareService = require("./services/cloudflare");
const prisma = new PrismaClient(); // Note: fixed typo - removed the 'r' after PrismaClient();
const { StatusCodes } = require("http-status-codes");
const cache = require("./services/cache");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const authenticate = require("./middleware/authentication");




// Security Packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:6000", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: StatusCodes.OK,
  preflightContinue: false,
};

// Middleware
app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 500, // Increased from 100 to 500 requests per window
    message:
      "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })
);
app.use(express.json());
app.use(helmet());
app.use(cors(corsOptions));
app.use(xss());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  });
});

// Routes
const authRouter = require("./routers/auth");
const adminRouter = require("./routers/admin");
const ticketRouter = require("./routers/tickets");
const machineRouter = require("./routers/machine");
const dashboardRouter = require("./routers/dashbord");
const gymRouter = require("./routers/gym");
const postRoutes = require('./routers/postRoutes');

// Use Routes
app.use("/api/v1/admin/auth", authRouter);
app.use("/api/v1/admin/admin", adminRouter);
app.use("/api/v1/admin/tickets", ticketRouter);
app.use("/api/v1/admin/machines", machineRouter);
app.use("/api/v1/admin/dashboard", dashboardRouter);
app.use("/api/v1/admin/gym", gymRouter);
app.use('/api/v1/admin/post', postRoutes); // Connect postRoutes


const port = process.env.PORT || 7800;
const maxRetries = 5;
const retryDelay = 2000; // 2 seconds

const connectWithRetry = async (retries = 0) => {
  try {
    await prisma.$connect();
    console.log("Connected to database successfully!");
    return true;
  } catch (error) {
    if (retries < maxRetries) {
      console.error(
        `Database connection attempt ${
          retries + 1
        } failed, retrying in ${retryDelay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return connectWithRetry(retries + 1);
    }
    throw error;
  }
};

// New function to test Cloudflare connection with retries
const testCloudflareWithRetry = async (retries = 0) => {
  try {
    const success = await cloudflareService.testConnection();
    if (success) {
      console.log("Cloudflare Images connection successful!");
      return true;
    }
    throw new Error("Cloudflare Images connection test failed");
  } catch (error) {
    if (retries < maxRetries) {
      console.error(
        `Cloudflare connection attempt ${
          retries + 1
        } failed, retrying in ${retryDelay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return testCloudflareWithRetry(retries + 1);
    }
    throw error;
  }
};

const start = async () => {
  try {
    // First test database connection
    await connectWithRetry();

    // Then test Cloudflare connection
    await testCloudflareWithRetry();

    // If both connections are successful, start the server
    app.listen(port, () =>
      console.log(`Server is listening on http://localhost:${port}`)
    );
  } catch (error) {
    console.error("Failed to start the server:", error);
    if (error.message.includes("Cloudflare")) {
      console.error(
        "Cloudflare Images service is unavailable. Server cannot start without image upload capability."
      );
    }
    process.exit(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

start();

module.exports = app;
