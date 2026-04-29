const Note = require("../models/note");
const { OK_CODE, CREATED_CODE } = require("../utils/errors");
const BadRequestError = require("../utils/errors/BadRequestError");
const NotFoundError = require("../utils/errors/NotFoundError");
const ForbiddenError = require("../utils/errors/ForbiddenError");

/**
 * GET /notes/:googleBookId
 *
 * Returns all notes written by the authenticated user for the given book,
 * sorted by page number ascending so the client receives them in reading order.
 *
 * An empty array is a valid successful response — the frontend shows an empty
 * state rather than an error when no notes have been created yet.
 */
const getNotesByBook = async (req, res, next) => {
  try {
    const notes = await Note.find({
      userId: req.user._id,
      googleBookId: req.params.googleBookId,
    }).sort({ pageNumber: 1 });

    res.status(OK_CODE).send({ data: notes });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notes
 *
 * Creates a new note for the authenticated user.
 * The userId is taken from the verified JWT payload — it is never read from
 * the request body, preventing a user from creating notes on behalf of
 * another user.
 */
const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({
      userId: req.user._id,
      googleBookId: req.body.googleBookId,
      pageNumber: req.body.pageNumber,
      title: req.body.title,
      content: req.body.content,
    });

    res.status(CREATED_CODE).send({ data: note });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

/**
 * PATCH /notes/:noteId
 *
 * Updates an existing note.  Only the owner (req.user._id === note.userId)
 * may update it — returns 403 otherwise.
 *
 * `{ new: true, runValidators: true }` ensures the response reflects the
 * updated document and schema-level constraints are enforced.
 */
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return next(new NotFoundError());
    }

    // Ownership check — prevent one authenticated user from editing another's note
    if (!note.userId.equals(req.user._id)) {
      return next(new ForbiddenError());
    }

    // Build the update object from only the fields Celebrate has validated —
    // any field absent from the request body is left unchanged.
    const updates = {};
    if (req.body.pageNumber !== undefined)
      updates.pageNumber = req.body.pageNumber;
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.content !== undefined) updates.content = req.body.content;

    const updated = await Note.findByIdAndUpdate(
      req.params.noteId,
      { $set: updates },
      { new: true, runValidators: true },
    );

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
 * DELETE /notes/:noteId
 *
 * Deletes a note belonging to the authenticated user.
 * Returns 404 if the note does not exist, 403 if it belongs to another user.
 * Returns 204 No Content on success.
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.noteId);

    if (!note) {
      return next(new NotFoundError());
    }

    // Ownership check — prevent deleting another user's note
    if (!note.userId.equals(req.user._id)) {
      return next(new ForbiddenError());
    }

    await note.deleteOne();
    res.status(204).send();
  } catch (err) {
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

module.exports = { getNotesByBook, createNote, updateNote, deleteNote };
