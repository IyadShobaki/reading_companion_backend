const Note = require("../models/note");

/**
 * Find all notes for a user/book pair in reading order.
 * @param {string} userId - Authenticated user id.
 * @param {string} googleBookId - Google Books volume id.
 * @returns {Promise<Object[]>} Note documents.
 */
const findByUserAndBook = (userId, googleBookId) =>
  Note.find({ userId, googleBookId }).sort({ pageNumber: 1 });

/**
 * Create a note for the authenticated user.
 * @param {string} userId - Authenticated user id.
 * @param {Object} noteData - Validated note payload.
 * @returns {Promise<Object>} Created note document.
 */
const createForUser = (userId, noteData) =>
  Note.create({
    userId,
    googleBookId: noteData.googleBookId,
    pageNumber: noteData.pageNumber,
    title: noteData.title,
    content: noteData.content,
  });

/**
 * Find one note by id.
 * @param {string} noteId - MongoDB note id.
 * @returns {Promise<Object|null>} Note document or null.
 */
const findById = (noteId) => Note.findById(noteId);

/**
 * Update one note by id with an explicit $set object.
 * @param {string} noteId - MongoDB note id.
 * @param {Object} updates - Validated note updates.
 * @returns {Promise<Object|null>} Updated note document or null.
 */
const updateById = (noteId, updates) =>
  Note.findByIdAndUpdate(
    noteId,
    { $set: updates },
    { new: true, runValidators: true },
  );

/**
 * Delete a note document.
 * @param {Object} note - Note document.
 * @returns {Promise<Object>} Mongoose delete result.
 */
const deleteNote = (note) => note.deleteOne();

module.exports = {
  findByUserAndBook,
  createForUser,
  findById,
  updateById,
  deleteNote,
};
