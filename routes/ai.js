/**
 * ai.js — Routes for AI reading-assistant endpoints.
 *
 * All routes are protected by the auth middleware (applied here) so the
 * AI service always has an authenticated user context.
 *
 * POST /ai/summarize  — Summarise the book around the current page.
 * POST /ai/explain    — Explain key concepts near the current page.
 * POST /ai/context    — Provide historical/literary context.
 * POST /ai/ask        — Answer a free-form question about the book.
 */

const router = require("express").Router();
const auth = require("../middlewares/auth");
const {
  validateAiRequest,
  validateAiAsk,
} = require("../middlewares/validation");
const { summarize, explain, context, ask } = require("../controllers/ai");

// Protect all AI routes — a valid JWT is required
router.use(auth);

router.post("/summarize", validateAiRequest, summarize);
router.post("/explain", validateAiRequest, explain);
router.post("/context", validateAiRequest, context);
router.post("/ask", validateAiAsk, ask);

module.exports = router;
