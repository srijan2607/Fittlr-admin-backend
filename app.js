// app.js

require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const cloudflareService = require("./services/cloudflare");
const prisma = new PrismaClient();r
const { StatusCodes } = require("http-status-codes");
const cache = require("./services/cache");
app.use(express.json());

// Security Packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:6000"],
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

const start = async () => {
  try {
    await connectWithRetry();
    app.listen(port, () =>
      console.log(`Server is listening on http://localhost:${port}`)
    );
  } catch (error) {
    console.error("Failed to start the server after multiple retries:", error);
    process.exit(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

start();
