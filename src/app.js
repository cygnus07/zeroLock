import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import routes from './routes/index.js';

export const createApp = () => {
  const app = express();

  console.log('🌐 Allowed CORS origins:', config.cors);
  app.use(cors(config.cors));
  app.use(helmet());

  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));
  app.use(cookieParser());
  app.use(compression());
  
  if (config.env !== 'test') {
    app.use(requestLogger);
  }
  
  const apiRateLimiter = rateLimit(config.rateLimit);
  app.use('/api', apiRateLimiter);

  
  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'API running',
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  app.use('/api', routes);

  app.use(errorHandler);

  return app;
};