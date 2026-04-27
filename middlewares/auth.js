const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../utils/config");
const UnauthorizedError = require("../utils/errors/UnauthorizedError");

// Extracts the token string from a "Bearer <token>" Authorization header
const extractBearerToken = (header) => header.split(" ")[1];

// JWT authentication middleware.
// Verifies the token and attaches the decoded payload to req.user so that
// downstream controllers can access the authenticated user's _id.
module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authorization required"));
  }

  const token = extractBearerToken(authorization);
  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return next(new UnauthorizedError("Authorization required"));
  }

  req.user = payload; // adding the payload to the Request object

  return next(); // passing the request further along
};
