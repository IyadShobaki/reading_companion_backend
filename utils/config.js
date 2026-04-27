// Load server configuration from environment variables with safe defaults.
// JWT_SECRET is required in production; missing it will crash the process immediately.
const {
  PORT = 3001,
  MONGODB_URI = "mongodb://127.0.0.1:27017/template_db",
  CLIENT_ORIGIN = "http://localhost:3000",
  RATE_LIMIT_WINDOW_MS = 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS = 100, // max 100 requests per window - dev env
  RATE_LIMIT_MESSAGE = "Too many requests from this IP, please try again later.",
} = process.env;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is not set.");
}

module.exports = {
  PORT: parseInt(PORT, 10),
  JWT_SECRET: JWT_SECRET || "dev-only-secret",
  MONGODB_URI,
  CLIENT_ORIGIN,
  RATE_LIMIT_WINDOW_MS: parseInt(RATE_LIMIT_WINDOW_MS, 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(RATE_LIMIT_MAX_REQUESTS, 10),
  RATE_LIMIT_MESSAGE,
};
