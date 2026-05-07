/**
 * ai.js — Controller for the AI reading chatbot endpoint.
 *
 * Delegates to the AI service layer and returns a standard
 * { data: { response } } envelope.
 */

const aiService = require("../services/ai.service");
const { OK_CODE } = require("../utils/errors");

/**
 * POST /ai/ask
 *
 * Requires `question` in the request body (validated by Celebrate).
 */
const ask = async (req, res, next) => {
  try {
    const {
      googleBookId,
      title,
      pageNumber,
      question,
      authors,
      description,
      categories,
    } = req.body;
    const result = await aiService.ask({
      googleBookId,
      title,
      pageNumber,
      question,
      authors,
      description,
      categories,
    });
    res.status(OK_CODE).send({ data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { ask };
