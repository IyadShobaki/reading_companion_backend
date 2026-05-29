const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const userRouter = require("./users");
const libraryRouter = require("./library");
const progressRouter = require("./progress");
const notesRouter = require("./notes");
const aiRouter = require("./ai");
const { login, createUser } = require("../controllers/users");
const NotFoundError = require("../utils/errors/NotFoundError");
const {
  validateUserLogin,
  validateUserCreate,
} = require("../middlewares/validation");

// Stricter rate limiter for auth endpoints — limits brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  message: "Too many auth attempts from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Public auth routes — no JWT required
router.post("/signin", authLimiter, validateUserLogin, login);
router.post("/signup", authLimiter, validateUserCreate, createUser);

// All /users/* routes — JWT required (enforced inside userRouter)
router.use("/users", userRouter);

// All /library/* routes — JWT required (enforced inside libraryRouter)
router.use("/library", libraryRouter);

// All /progress/* routes — JWT required (enforced inside progressRouter)
router.use("/progress", progressRouter);

// All /notes/* routes — JWT required (enforced inside notesRouter)
router.use("/notes", notesRouter);

// All /ai/* routes — JWT required (enforced inside aiRouter)
router.use("/ai", aiRouter);

// Catch-all for any unmatched route
router.use((req, res, next) => {
  next(new NotFoundError());
});
module.exports = router;
