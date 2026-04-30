/**
 * ai.js — Controller for AI reading-assistant endpoints.
 *
 * All actions delegate to the AI service layer and return a standard
 * { data: { response } } envelope. The service handles prompting,
 * timeout, and error normalisation so controllers stay thin.
 *
 * /ai/ask additionally requires a `question` field in the body (validated
 * by Celebrate before the controller is reached).
 */

const aiService = require("../services/ai.service");
const { OK_CODE } = require("../utils/errors");

/**
 * POST /ai/summarize
 */
const summarize = async (req, res, next) => {
  try {
    const { googleBookId, title, pageNumber } = req.body;
    const result = await aiService.summarize({
      googleBookId,
      title,
      pageNumber,
    });
    res.status(OK_CODE).send({ data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /ai/explain
 */
const explain = async (req, res, next) => {
  try {
    const { googleBookId, title, pageNumber } = req.body;
    const result = await aiService.explain({ googleBookId, title, pageNumber });
    res.status(OK_CODE).send({ data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /ai/context
 */
const context = async (req, res, next) => {
  try {
    const { googleBookId, title, pageNumber } = req.body;
    const result = await aiService.context({ googleBookId, title, pageNumber });
    res.status(OK_CODE).send({ data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /ai/ask
 *
 * Requires `question` in the request body (validated by Celebrate).
 */
const ask = async (req, res, next) => {
  try {
    const { googleBookId, title, pageNumber, question } = req.body;
    const result = await aiService.ask({
      googleBookId,
      title,
      pageNumber,
      question,
    });
    res.status(OK_CODE).send({ data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { summarize, explain, context, ask };
