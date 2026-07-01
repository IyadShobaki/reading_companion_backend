/**
 * users.js — Controller for user authentication and profile management.
 *
 * Handles sign-in, registration, fetching the current user's profile,
 * and updating profile fields (name, avatar).
 *
 * Routes that consume these handlers:
 *   POST  /api/signin    → login
 *   POST  /api/signup    → createUser
 *   GET   /api/users/me  → getCurrentUser
 *   PATCH /api/users/me  → updateUserProfile
 *
 * All functions follow the Express (req, res, next) convention.
 * Operational errors are forwarded to next() for centralised handling.
 */

const userRepository = require("../repositories/user.repository");
const authService = require("../services/auth.service");
const {
  CREATED_CODE,
  DUPLICATE_KEY_ERROR_CODE,
  OK_CODE,
} = require("../utils/errors");
const BadRequestError = require("../utils/errors/BadRequestError");
const NotFoundError = require("../utils/errors/NotFoundError");
const ConflictError = require("../utils/errors/ConflictError");
const UnauthorizedError = require("../utils/errors/UnauthorizedError");

/**
 * Authenticate a user and return a JWT with public user data.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError();
    }

    await authService.verifyPassword(password, user.password);
    res.send({
      token: authService.signToken(user._id),
      data: authService.toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Register a user and return the public user envelope.
 */
const createUser = async (req, res, next) => {
  try {
    const hash = await authService.hashPassword(req.body.password);
    const user = await userRepository.create({
      email: req.body.email,
      password: hash,
      name: req.body.name,
      avatar: req.body.avatar,
    });

    res.status(CREATED_CODE).send({ data: authService.toPublicUser(user) });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new BadRequestError());
    }
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      return next(new ConflictError());
    }
    next(err);
  }
};

/**
 * Return the authenticated user's public profile data.
 */
const getCurrentUser = async (req, res, next) => {
  const { _id: userId } = req.user;
  try {
    const user = await userRepository.findById(userId);
    res.status(OK_CODE).send({ data: authService.toPublicUser(user) });
  } catch (err) {
    if (err.name === "DocumentNotFoundError") {
      return next(new NotFoundError());
    }
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

/**
 * Update only the supplied profile fields for the authenticated user.
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.avatar !== undefined) updates.avatar = req.body.avatar;

    const user = await userRepository.updateProfile(req.user._id, updates);
    res.status(OK_CODE).send({ data: authService.toPublicUser(user) });
  } catch (err) {
    if (err.name === "DocumentNotFoundError") {
      return next(new NotFoundError());
    }
    if (err.name === "CastError") {
      return next(new BadRequestError());
    }
    next(err);
  }
};

module.exports = { updateUserProfile, getCurrentUser, createUser, login };
