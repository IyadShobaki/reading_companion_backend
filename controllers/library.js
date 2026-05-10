/**
 * library.js — Controller for the authenticated user's saved-book library.
 *
 * Handles listing, saving, and removing books from a user's personal library.
 *
 * Routes that consume these handlers:
 *   GET    /api/library                  → getLibrary
 *   POST   /api/library                  → saveBook
 *   DELETE /api/library/:googleBookId    → removeBook
 *
 * All functions follow the Express (req, res, next) convention.
 * Ownership is verified before any mutation.
 */

const savedBookRepository = require("../repositories/savedBook.repository");
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
 * Returns all books saved by the authenticated user, newest first.
 */
const getLibrary = async (req, res, next) => {
  try {
    const books = await savedBookRepository.findByUser(req.user._id);
    res.status(OK_CODE).send({ data: books });
  } catch (err) {
    next(err);
  }
};

/**
 * Saves a book for the authenticated user.
 */
const saveBook = async (req, res, next) => {
  try {
    const book = await savedBookRepository.createForUser(
      req.user._id,
      req.body,
    );
    res.status(CREATED_CODE).send({ data: book });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new BadRequestError());
    }
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      return next(new ConflictError("Book already saved."));
    }
    next(err);
  }
};

/**
 * Removes a book from the authenticated user's library.
 */
const removeBook = async (req, res, next) => {
  try {
    const book = await savedBookRepository.findByUserAndGoogleId(
      req.user._id,
      req.params.googleBookId,
    );

    if (!book) {
      return next(new NotFoundError());
    }

    if (!book.userId.equals(req.user._id)) {
      return next(new ForbiddenError());
    }

    await savedBookRepository.deleteBook(book);
    res.status(204).send();
  } catch (err) {
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

module.exports = { getLibrary, saveBook, removeBook };
