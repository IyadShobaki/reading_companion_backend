/**
 * library.js — Protected saved-book library routes.
 *
 * Base path: /api/library  (mounted by routes/index.js)
 *
 * GET    /                  — list all saved books for the authenticated user
 * POST   /                  — save a book to the library
 * DELETE /:googleBookId     — remove a book from the library
 *
 * All routes require a valid JWT (enforced by the auth middleware).
 */

const router = require("express").Router();
const { getLibrary, saveBook, removeBook } = require("../controllers/library");
const auth = require("../middlewares/auth");
const {
  validateGoogleBookIdParam,
  validateSaveBook,
} = require("../middlewares/validation");

// All library routes require a valid JWT
router.get("/", auth, getLibrary);
router.post("/", auth, validateSaveBook, saveBook);
router.delete("/:googleBookId", auth, validateGoogleBookIdParam, removeBook);

module.exports = router;
