/**
 * users.js — Protected user routes.
 *
 * Base path: /api/users  (mounted by routes/index.js)
 *
 * GET  /me   — return the authenticated user's public profile
 * PATCH /me  — update name and/or avatar URL
 *
 * All routes require a valid JWT (enforced by the auth middleware).
 */

const router = require("express").Router();
const { getCurrentUser, updateUserProfile } = require("../controllers/users");
const auth = require("../middlewares/auth");
const { validateUserUpdate } = require("../middlewares/validation");

// All routes below require a valid JWT — auth middleware enforces this
router.get("/me", auth, getCurrentUser);
router.patch("/me", auth, validateUserUpdate, updateUserProfile);

module.exports = router;
