const router = require("express").Router();
const {
  getNotesByUser,
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
