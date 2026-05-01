const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../utils/config");
const UnauthorizedError = require("../utils/errors/UnauthorizedError");

const SALT_ROUNDS = 10;
const TOKEN_TTL = "7d";

/**
 * Hash a plaintext password before persistence.
 * @param {string} password - Plaintext password from the validated request.
 * @returns {Promise<string>} Bcrypt password hash.
 */
const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * @param {string} password - Plaintext password from the signin request.
 * @param {string} passwordHash - Stored bcrypt hash.
 * @returns {Promise<void>} Resolves on match, throws UnauthorizedError otherwise.
 */
const verifyPassword = async (password, passwordHash) => {
  const matched = await bcrypt.compare(password, passwordHash);
  if (!matched) {
    throw new UnauthorizedError();
  }
};

/**
 * Sign the short JWT payload used by protected backend routes.
 * @param {string} userId - MongoDB user id.
 * @returns {string} Signed JWT.
 */
const signToken = (userId) =>
  jwt.sign({ _id: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });

/**
 * Convert a User document into the public API user shape.
 * @param {Object} user - User document or plain object.
 * @returns {{_id: string, email: string, name: string, avatar: string}}
 */
const toPublicUser = (user) => ({
  _id: user._id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
});

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  toPublicUser,
};
