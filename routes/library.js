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
