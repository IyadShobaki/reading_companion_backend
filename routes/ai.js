/**
 * ai.js — Route for the AI reading chatbot endpoint.
 *
 * The route is protected by the auth middleware so the AI service always
 * has an authenticated user context.
 *
 * POST /ai/ask — Answer a question about the current book.
 */

const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const auth = require("../middlewares/auth");
const { validateAiAsk } = require("../middlewares/validation");
const { ask } = require("../controllers/ai");

// Per-IP rate limiter for AI requests — protects OpenAI quota/cost
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  // Key by authenticated user ID so the limit is per-user, not per-IP
  keyGenerator: (req) => req.user?._id?.toString() ?? req.ip,
  message: "Too many AI requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Protect all AI routes — a valid JWT is required
router.use(auth);

router.post("/ask", aiLimiter, validateAiAsk, ask);

module.exports = router;
