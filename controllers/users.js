const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { JWT_SECRET } = require("../utils/config");
const {
  CREATED_CODE,
  DUPLICATE_KEY_ERROR_CODE,
  OK_CODE,
} = require("../utils/errors");
const BadRequestError = require("../utils/errors/BadRequestError");
const NotFoundError = require("../utils/errors/NotFoundError");
const ConflictError = require("../utils/errors/ConflictError");

// Authenticate a user and return a signed JWT alongside the user's public data.
// The client uses the returned token for all subsequent authenticated requests.
const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findUserByCredentials(email, password);
    res.send({
      // Sign a 7-day JWT containing only the user's _id as payload
      token: jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: "7d" }),
      // Return public user fields so the client avoids a second /users/me call
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Register a new user. Hashes the password before storing and returns
// the created user without the password field.
const createUser = async (req, res, next) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      email: req.body.email,
      password: hash,
      name: req.body.name,
      avatar: req.body.avatar,
    });
    res.status(CREATED_CODE).send({
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new BadRequestError());
    }
    // Duplicate email — MongoDB error code 11000
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      return next(new ConflictError());
    }
    next(err);
  }
};

// Return the authenticated user's public profile data.
// The user's _id is taken from the JWT payload attached by the auth middleware.
const getCurrentUser = async (req, res, next) => {
  const { _id: userId } = req.user;
  try {
    const user = await User.findById(userId).orFail();
    res.status(OK_CODE).send({
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
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

// Update the authenticated user's name and/or avatar.
// runValidators ensures Mongoose schema validators run on the updated fields.
const updateUserProfile = async (req, res, next) => {
  const { name, avatar } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    ).orFail();
    res.status(OK_CODE).send({
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
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
