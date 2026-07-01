// Applies a sliding-window rate limit to every incoming request.
// Protects against brute-force and DoS attacks.
// Window size and max count are configurable via environment variables.
const rateLimit = require("express-rate-limit");
const {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_MESSAGE,
} = require("../utils/config");

// Rate limiter middleware to protect against DoS attacks
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX_REQUESTS,
  message: RATE_LIMIT_MESSAGE,
  statusCode: 429,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

module.exports = limiter;
