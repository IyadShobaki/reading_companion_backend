const { Joi, celebrate } = require("celebrate");
const validator = require("validator");

// Custom URL validation method
const validateURL = (value, helpers) => {
  if (value === "" || validator.isURL(value)) {
    return value;
  }
  return helpers.error("string.uri");
};

// Validate user creation
const validateUserCreate = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      "string.empty": "The email field must be filled in",
      "string.email": "The email field must be a valid email",
    }),
    password: Joi.string().required().messages({
      "string.empty": "The password field must be filled in",
    }),
    name: Joi.string().required().min(2).max(30).messages({
      "string.min": "The minimum length of the name field is 2",
      "string.max": "The maximum length of the name field is 30",
      "string.empty": "The name field must be filled in",
    }),
    avatar: Joi.string().allow("").custom(validateURL).messages({
      "string.uri": "The avatar field must be a valid URL",
    }),
  }),
});

// Validate user login
const validateUserLogin = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      "string.empty": "The email field must be filled in",
      "string.email": "The email field must be a valid email",
    }),
    password: Joi.string().required().messages({
      "string.empty": "The password field must be filled in",
    }),
  }),
});

// Validate user profile update
const validateUserUpdate = celebrate({
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(30).messages({
        "string.min": "The minimum length of the name field is 2",
        "string.max": "The maximum length of the name field is 30",
      }),
      avatar: Joi.string().allow("").custom(validateURL).messages({
        "string.uri": "The avatar field must be a valid URL",
      }),
    })
    .or("name", "avatar"),
});

module.exports = {
  validateUserCreate,
  validateUserLogin,
  validateUserUpdate,
};
