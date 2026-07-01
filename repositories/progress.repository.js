const Progress = require("../models/progress");

/**
 * Find progress for one user/book pair.
 * @param {string} userId - Authenticated user id.
 * @param {string} googleBookId - Google Books volume id.
 * @returns {Promise<Object|null>} Progress document or null.
 */
const findByUserAndBook = (userId, googleBookId) =>
  Progress.findOne({ userId, googleBookId });

/**
 * Create or update the saved page for one user/book pair.
 * @param {string} userId - Authenticated user id.
 * @param {string} googleBookId - Google Books volume id.
 * @param {number} pageNumber - Positive page number.
 * @returns {Promise<Object>} Upserted progress document.
 */
const upsertPage = (userId, googleBookId, pageNumber) =>
  Progress.findOneAndUpdate(
    { userId, googleBookId },
    { $set: { pageNumber } },
    { new: true, upsert: true, runValidators: true },
  );

module.exports = {
  findByUserAndBook,
  upsertPage,
};
