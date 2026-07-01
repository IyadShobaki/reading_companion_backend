const User = require("../models/user");

/**
 * Create a user document with an already-hashed password.
 * @param {Object} userData - User fields accepted by the User model.
 * @returns {Promise<Object>} Created user document.
 */
const create = (userData) => User.create(userData);

/**
 * Find a user by email and include the password hash for authentication.
 * @param {string} email - Normalized user email.
 * @returns {Promise<Object|null>} User document or null.
 */
const findByEmailWithPassword = (email) =>
  User.findOne({ email }).select("+password");

/**
 * Find a user by MongoDB id and fail when no document exists.
 * @param {string} userId - Authenticated user id.
 * @returns {Promise<Object>} User document.
 */
const findById = (userId) => User.findById(userId).orFail();

/**
 * Update only the provided profile fields for a user.
 * @param {string} userId - Authenticated user id.
 * @param {Object} updates - Validated profile updates.
 * @returns {Promise<Object>} Updated user document.
 */
const updateProfile = (userId, updates) =>
  User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true },
  ).orFail();

module.exports = {
  create,
  findByEmailWithPassword,
  findById,
  updateProfile,
};
