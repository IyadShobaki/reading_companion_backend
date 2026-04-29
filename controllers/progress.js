const Progress = require("../models/progress");
const { OK_CODE } = require("../utils/errors");
const BadRequestError = require("../utils/errors/BadRequestError");
const NotFoundError = require("../utils/errors/NotFoundError");

/**
 * GET /progress/:googleBookId
 *
 * Returns the authenticated user's saved page number for the given book.
 * Returns 404 if no progress has been saved yet — the frontend treats this as
 * "start from page 1" and should not surface it as an error to the user.
 */
const getProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      googleBookId: req.params.googleBookId,
    });

    if (!progress) {
      return next(new NotFoundError());
    }

    res.status(OK_CODE).send({
      data: {
        googleBookId: progress.googleBookId,
        pageNumber: progress.pageNumber,
      },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

/**
 * PUT /progress/:googleBookId
 *
 * Creates or updates the authenticated user's progress for the given book.
 * Uses a MongoDB upsert so the operation is idempotent — calling it multiple
 * times with the same page number is safe and produces the same result.
 *
 * `{ new: true }` returns the updated document so the response always
 * reflects the current persisted state.
 * `{ runValidators: true }` ensures schema-level constraints (e.g. min: 1)
 * are enforced on update as well as on insert.
 */
const saveProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findOneAndUpdate(
      // Filter — the unique record for this user + book
      { userId: req.user._id, googleBookId: req.params.googleBookId },
      // Update — set the new page number
      { $set: { pageNumber: req.body.pageNumber } },
      // Options — create the document if it does not exist
      { new: true, upsert: true, runValidators: true },
    );

    res.status(OK_CODE).send({
      data: {
        googleBookId: progress.googleBookId,
        pageNumber: progress.pageNumber,
      },
    });
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

module.exports = { getProgress, saveProgress };
