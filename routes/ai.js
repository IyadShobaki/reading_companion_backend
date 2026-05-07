/**
 * ai.js — Route for the AI reading chatbot endpoint.
 *
 * The route is protected by the auth middleware so the AI service always
 * has an authenticated user context.
 *
 * POST /ai/ask — Answer a question about the current book.
 */

const router = require("express").Router();
const auth = require("../middlewares/auth");
const { validateAiAsk } = require("../middlewares/validation");
const { ask } = require("../controllers/ai");

// Protect all AI routes — a valid JWT is required
router.use(auth);

router.post("/ask", validateAiAsk, ask);

module.exports = router;
