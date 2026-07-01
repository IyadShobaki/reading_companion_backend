// Load server configuration from environment variables with safe defaults.
// JWT_SECRET is required in all environments; missing it will crash the process immediately.
const {
  PORT = 3001,
  MONGODB_URI = "mongodb://127.0.0.1:27017/rc_db",
  CLIENT_ORIGIN = "http://localhost:3000",
  RATE_LIMIT_WINDOW_MS = 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS = 100, // max 100 requests per window - dev env
  RATE_LIMIT_MESSAGE = "Too many requests from this IP, please try again later.",
  AI_TIMEOUT_MS = 15000,
  JWT_EXPIRES_IN = "24h",
} = process.env;

// Parse TRUST_PROXY: supports boolean strings ("true"/"false") or a hop-count number
const rawProxy = process.env.TRUST_PROXY ?? "0";
const TRUST_PROXY =
  rawProxy === "true"
    ? true
    : rawProxy === "false"
      ? false
      : parseInt(rawProxy, 10) || 0;

const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set.");
}

if (!OPENAI_API_KEY && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: OPENAI_API_KEY environment variable is not set.");
}

module.exports = {
  PORT: parseInt(PORT, 10),
  JWT_SECRET,
  JWT_EXPIRES_IN,
  MONGODB_URI,
  CLIENT_ORIGIN,
  TRUST_PROXY,
  RATE_LIMIT_WINDOW_MS: parseInt(RATE_LIMIT_WINDOW_MS, 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(RATE_LIMIT_MAX_REQUESTS, 10),
  RATE_LIMIT_MESSAGE,
  OPENAI_API_KEY: OPENAI_API_KEY || "",
  AI_TIMEOUT_MS: parseInt(AI_TIMEOUT_MS, 10),
};
