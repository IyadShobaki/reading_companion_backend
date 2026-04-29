const router = require("express").Router();

const userRouter = require("./users");
const libraryRouter = require("./library");
const progressRouter = require("./progress");
const { login, createUser } = require("../controllers/users");
const NotFoundError = require("../utils/errors/NotFoundError");
const {
  validateUserLogin,
  validateUserCreate,
} = require("../middlewares/validation");

// Public auth routes — no JWT required
router.post("/signin", validateUserLogin, login);
router.post("/signup", validateUserCreate, createUser);

// All /users/* routes — JWT required (enforced inside userRouter)
router.use("/users", userRouter);

// All /library/* routes — JWT required (enforced inside libraryRouter)
router.use("/library", libraryRouter);

// All /progress/* routes — JWT required (enforced inside progressRouter)
router.use("/progress", progressRouter);

// Catch-all for any unmatched route
router.use((req, res, next) => {
  next(new NotFoundError());
});
module.exports = router;
