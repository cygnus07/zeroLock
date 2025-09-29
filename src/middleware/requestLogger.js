import morgan from 'morgan';
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

morgan.token('real-ip', (req) => {
  return req.headers['x-real-ip'] || 
         req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         'unknown';
});

const devFormat = ':method :url :status :res[content-length] - :response-time ms';
const prodFormat = ':real-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

export const requestLogger = config.env === 'development' 
  ? morgan(devFormat, { stream: logger.httpStream })
  : morgan(prodFormat, { stream: logger.httpStream });