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
