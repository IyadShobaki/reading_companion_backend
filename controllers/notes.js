/**
 * notes.js — Controller for note CRUD operations.
 *
 * Handles fetching, creating, updating, and deleting notes scoped to a user
 * and optionally a specific book. Ownership is verified before any mutation.
 *
 * Routes that consume these handlers:
 *   GET    /api/notes                    → getNotesByUser
 *   GET    /api/notes/:googleBookId      → getNotesByBook
 *   POST   /api/notes                    → createNote
 *   PATCH  /api/notes/:noteId            → updateNote
 *   DELETE /api/notes/:noteId            → deleteNote
 *
 * All functions follow the Express (req, res, next) convention.
 */

const noteRepository = require("../repositories/note.repository");
const { OK_CODE, CREATED_CODE } = require("../utils/errors");
const BadRequestError = require("../utils/errors/BadRequestError");
const NotFoundError = require("../utils/errors/NotFoundError");
const ForbiddenError = require("../utils/errors/ForbiddenError");

/**
 * Returns all notes written by the authenticated user across all books.
 */
const getNotesByUser = async (req, res, next) => {
  try {
    const notes = await noteRepository.findByUser(req.user._id);
    res.status(OK_CODE).send({ data: notes });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns all notes written by the authenticated user for a book.
 */
const getNotesByBook = async (req, res, next) => {
  try {
    const notes = await noteRepository.findByUserAndBook(
      req.user._id,
      req.params.googleBookId,
    );

    res.status(OK_CODE).send({ data: notes });
  } catch (err) {
    next(err);
  }
};

/**
 * Creates a note for the authenticated user.
 */
const createNote = async (req, res, next) => {
  try {
    const note = await noteRepository.createForUser(req.user._id, req.body);

    res.status(CREATED_CODE).send({ data: note });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

/**
 * Updates an existing note after verifying ownership.
 */
const updateNote = async (req, res, next) => {
  try {
    const note = await noteRepository.findById(req.params.noteId);

    if (!note) {
      return next(new NotFoundError());
    }

    if (!note.userId.equals(req.user._id)) {
      return next(new ForbiddenError());
    }

    const updates = {};
    if (req.body.pageNumber !== undefined)
      updates.pageNumber = req.body.pageNumber;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.content !== undefined) updates.content = req.body.content;

    const updated = await noteRepository.updateById(req.params.noteId, updates);

    res.status(OK_CODE).send({ data: updated });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new BadRequestError());
    }
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

/**
 * Deletes a note after verifying ownership.
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await noteRepository.findById(req.params.noteId);

    if (!note) {
      return next(new NotFoundError());
    }

    if (!note.userId.equals(req.user._id)) {
      return next(new ForbiddenError());
    }

    await noteRepository.deleteNote(note);
    res.status(204).send();
  } catch (err) {
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

module.exports = {
  getNotesByUser,
  getNotesByBook,
  createNote,
  updateNote,
  deleteNote,
};
