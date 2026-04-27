// ESLint flat config (ESLint 9+).
// Replaces the legacy .eslintrc.js; uses @eslint/js recommended rules
// supplemented with the project-specific overrides carried over from the
// old airbnb-base configuration.

const js = require("@eslint/js");
const globals = require("globals");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  // Ignore generated/dependency directories
  {
    ignores: ["node_modules/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        // Standard Node.js and ES2021 globals
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Start from the recommended rule set
      ...js.configs.recommended.rules,

      // Warn on console usage but allow console.error for server-side error logging
      "no-console": ["warn", { allow: ["error"] }],

      // Allow _id (MongoDB document identifier) as an underscore-prefixed name
      "no-underscore-dangle": ["error", { allow: ["_id"] }],

      // Enforce no unused variables; ignore Express 'next' middleware parameters
      "no-unused-vars": ["error", { argsIgnorePattern: "next" }],
    },
  },

  // Disable ESLint rules that conflict with Prettier formatting (must be last)
  prettierConfig,
];
