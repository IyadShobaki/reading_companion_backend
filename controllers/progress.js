/**
 * progress.js — Controller for per-book reading progress.
 *
 * Handles retrieving and upserting the last-saved page number for a book.
 * A single PUT endpoint handles both create and update via an upsert operation.
 *
 * Routes that consume these handlers:
 *   GET /api/progress/:googleBookId  → getProgress
 *   PUT /api/progress/:googleBookId  → saveProgress
 *
 * All functions follow the Express (req, res, next) convention.
 */

const progressRepository = require("../repositories/progress.repository");
const { OK_CODE } = require("../utils/errors");
const BadRequestError = require("../utils/errors/BadRequestError");
const NotFoundError = require("../utils/errors/NotFoundError");

/**
 * Returns the authenticated user's saved page number for a book.
 */
const getProgress = async (req, res, next) => {
  try {
    const progress = await progressRepository.findByUserAndBook(
      req.user._id,
      req.params.googleBookId,
    );

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
 * Creates or updates the authenticated user's progress for a book.
 */
const saveProgress = async (req, res, next) => {
  try {
    const progress = await progressRepository.upsertPage(
      req.user._id,
      req.params.googleBookId,
      req.body.pageNumber,
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
