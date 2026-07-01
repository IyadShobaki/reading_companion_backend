const SavedBook = require("../models/savedBook");

/**
 * Find all books saved by a user, newest first.
 * @param {string} userId - Authenticated user id.
 * @returns {Promise<Object[]>} Saved book documents.
 */
const findByUser = (userId) =>
  SavedBook.find({ userId }).sort({ savedAt: -1 });

/**
 * Persist a saved book for the authenticated user.
 * @param {string} userId - Authenticated user id.
 * @param {Object} bookData - Validated book metadata.
 * @returns {Promise<Object>} Created saved book document.
 */
const createForUser = (userId, bookData) =>
  SavedBook.create({
    userId,
    googleBookId: bookData.googleBookId,
    title: bookData.title,
    authors: bookData.authors,
    thumbnail: bookData.thumbnail,
    description: bookData.description,
    categories: bookData.categories,
    language: bookData.language,
    publishedDate: bookData.publishedDate,
    embeddable: bookData.embeddable,
    viewability: bookData.viewability,
    publicDomain: bookData.publicDomain,
    webReaderLink: bookData.webReaderLink,
  });

/**
 * Find one saved book scoped to a user and Google Books volume id.
 * @param {string} userId - Authenticated user id.
 * @param {string} googleBookId - Google Books volume id.
 * @returns {Promise<Object|null>} Saved book document or null.
 */
const findByUserAndGoogleId = (userId, googleBookId) =>
  SavedBook.findOne({ userId, googleBookId });

/**
 * Delete a saved book document.
 * @param {Object} book - Saved book document.
 * @returns {Promise<Object>} Mongoose delete result.
 */
const deleteBook = (book) => book.deleteOne();

module.exports = {
  findByUser,
  createForUser,
  findByUserAndGoogleId,
  deleteBook,
};
