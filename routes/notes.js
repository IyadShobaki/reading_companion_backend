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
  validateUpdateNote,
} = require("../middlewares/validation");

// All notes routes require a valid JWT
router.get("/:googleBookId", auth, getNotesByBook);
router.post("/", auth, validateCreateNote, createNote);
router.patch("/:noteId", auth, validateUpdateNote, updateNote);
router.delete("/:noteId", auth, deleteNote);

module.exports = router;
