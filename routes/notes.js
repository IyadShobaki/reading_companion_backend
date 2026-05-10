/**
 * notes.js — Protected note routes.
 *
 * Base path: /api/notes  (mounted by routes/index.js)
 *
 * GET    /                  — all notes for the authenticated user (across all books)
 * GET    /:googleBookId     — all notes for a specific book
 * POST   /                  — create a new note
 * PATCH  /:noteId           — update a note (ownership verified in the controller)
 * DELETE /:noteId           — delete a note (ownership verified in the controller)
 *
 * All routes require a valid JWT (enforced by the auth middleware).
 */

const router = require("express").Router();
const {
  getNotesByBook,
  createNote,
  updateNote,
  deleteNote,
} = require("../controllers/notes");
const auth = require("../middlewares/auth");
const {
  validateCreateNote,
  validateGoogleBookIdParam,
  validateNoteIdParam,
  validateUpdateNote,
} = require("../middlewares/validation");

// All notes routes require a valid JWT
// GET /notes  — all notes for the authenticated user (must come before /:googleBookId)
router.get("/", auth, getNotesByUser);
router.get("/:googleBookId", auth, validateGoogleBookIdParam, getNotesByBook);
router.post("/", auth, validateCreateNote, createNote);
router.patch(
  "/:noteId",
  auth,
  validateNoteIdParam,
  validateUpdateNote,
  updateNote,
);
router.delete("/:noteId", auth, validateNoteIdParam, deleteNote);

module.exports = router;
