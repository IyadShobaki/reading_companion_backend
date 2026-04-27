const path = require("path");
const winston = require("winston");
const expressWinston = require("express-winston");

// Request logger format: plain message only
const requestFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    ({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`
  )
);

// Error logger format: prefer stack trace when available
const errorFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    ({ level, message, meta, timestamp }) =>
      `${timestamp} ${level}: ${meta.error?.stack || message}`
  )
);

// Request logger - logs all incoming requests
const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      format: requestFormat,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/request.log"),
    }),
  ],
  format: winston.format.json(),
});

// Error logger - logs all errors
const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      format: errorFormat,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
    }),
  ],
  format: winston.format.json(),
});

module.exports = {
  requestLogger,
  errorLogger,
  logger: winston.createLogger({
    transports: [new winston.transports.Console({ format: requestFormat })],
  }),
};
