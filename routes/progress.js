const router = require("express").Router();
const { getProgress, saveProgress } = require("../controllers/progress");
const auth = require("../middlewares/auth");
const { validateSaveProgress } = require("../middlewares/validation");

// All progress routes require a valid JWT
router.get("/:googleBookId", auth, getProgress);
router.put("/:googleBookId", auth, validateSaveProgress, saveProgress);

module.exports = router;
