import winston from 'winston';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray',
};

winston.addColors(colors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

const transports = [
  new winston.transports.Console({
    format: config.env === 'development' ? consoleFormat : logFormat,
    level: config.env === 'development' ? 'debug' : 'info',
  }),
];

if (config.env !== 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

const baseLogger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

class Logger {
  constructor(winstonLogger) {
    this.logger = winstonLogger;
  }

  info(message, meta) {
    this.logger.info(message, meta);
  }

  error(message, meta) {
    this.logger.error(message, meta);
  }

  warn(message, meta) {
    this.logger.warn(message, meta);
  }

  debug(message, meta) {
    this.logger.debug(message, meta);
  }

  http(message, meta) {
    this.logger.http(message, meta);
  }

  get httpStream() {
    return {
      write: (message) => {
        this.logger.http(message.trim());
      },
    };
  }

  logRequest(req, message, meta = {}) {
    this.logger.info(message, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
      ...meta,
    });
  }

  logError(error, req = null, message = 'Error occurred') {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    };

    if (req) {
      errorInfo.request = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id,
      };
    }

    this.logger.error(message, errorInfo);
  }

  logSecurity(event, details = {}) {
    this.logger.warn(`SECURITY: ${event}`, {
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  logDatabase(operation, details = {}) {
    this.logger.debug(`DATABASE: ${operation}`, details);
  }
}

const logger = new Logger(baseLogger);
export default logger;