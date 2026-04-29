const SavedBook = require("../models/savedBook");
const {
  OK_CODE,
  CREATED_CODE,
  DUPLICATE_KEY_ERROR_CODE,
} = require("../utils/errors");
const BadRequestError = require("../utils/errors/BadRequestError");
const NotFoundError = require("../utils/errors/NotFoundError");
const ForbiddenError = require("../utils/errors/ForbiddenError");
const ConflictError = require("../utils/errors/ConflictError");

/**
 * GET /library
 *
 * Returns all books saved by the authenticated user, sorted by most recently
 * saved first.  Only documents belonging to req.user._id are returned.
 */
const getLibrary = async (req, res, next) => {
  try {
    const books = await SavedBook.find({ userId: req.user._id }).sort({
      savedAt: -1,
    });
    res.status(OK_CODE).send({ data: books });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /library
 *
 * Saves a book for the authenticated user.  Returns 409 if the book is
 * already in the user's library (enforced by the unique compound index on
 * { userId, googleBookId }).
 */
const saveBook = async (req, res, next) => {
  try {
    const book = await SavedBook.create({
      userId: req.user._id,
      googleBookId: req.body.googleBookId,
      title: req.body.title,
      authors: req.body.authors,
      thumbnail: req.body.thumbnail,
      description: req.body.description,
      categories: req.body.categories,
      language: req.body.language,
      publishedDate: req.body.publishedDate,
      embeddable: req.body.embeddable,
      viewability: req.body.viewability,
      publicDomain: req.body.publicDomain,
      webReaderLink: req.body.webReaderLink,
    });
    res.status(CREATED_CODE).send({ data: book });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new BadRequestError());
    }
    // Duplicate key — the user already saved this book
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      return next(new ConflictError("Book already saved."));
    }
    next(err);
  }
};

/**
 * DELETE /library/:googleBookId
 *
 * Removes the saved book from the authenticated user's library.
 * Returns 404 if the book is not found, 403 if it belongs to another user
 * (should not happen in practice but guards against ID guessing).
 * Returns 204 No Content on success.
 */
const removeBook = async (req, res, next) => {
  try {
    const book = await SavedBook.findOne({
      googleBookId: req.params.googleBookId,
      userId: req.user._id,
    });

    if (!book) {
      return next(new NotFoundError());
    }

    // Extra ownership guard — belt-and-suspenders in case findOne ever
    // returns a document owned by a different user.
    if (!book.userId.equals(req.user._id)) {
      return next(new ForbiddenError());
    }

    await book.deleteOne();
    res.status(204).send();
  } catch (err) {
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

module.exports = { getLibrary, saveBook, removeBook };
