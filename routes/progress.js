/**
 * progress.js — Protected reading-progress routes.
 *
 * Base path: /api/progress  (mounted by routes/index.js)
 *
 * GET /:googleBookId  — retrieve last-saved page number for a book
 * PUT /:googleBookId  — create or update reading progress (upsert)
 *
 * All routes require a valid JWT (enforced by the auth middleware).
 */

const router = require("express").Router();
const { getProgress, saveProgress } = require("../controllers/progress");
const auth = require("../middlewares/auth");
const {
  validateGoogleBookIdParam,
  validateSaveProgress,
} = require("../middlewares/validation");

// All progress routes require a valid JWT
router.get("/:googleBookId", auth, validateGoogleBookIdParam, getProgress);
router.put(
  "/:googleBookId",
  auth,
  validateGoogleBookIdParam,
  validateSaveProgress,
  saveProgress,
);

module.exports = router;
