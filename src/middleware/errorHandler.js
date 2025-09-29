import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

export const errorHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  logger.logError(err, req, 'Request error occurred');

  res.status(statusCode).json({
    success: false,
    error: {
      message: config.env === 'production' && !isOperational 
        ? 'Something went wrong' 
        : message,
      ...(config.env === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
  });
};