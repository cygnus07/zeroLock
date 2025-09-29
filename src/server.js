import { createApp } from './app.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';

process.on('uncaughtException', (error) => {
  logger.logError(error, null, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.logError(error, null, 'Unhandled Rejection');
  process.exit(1);
});

const startServer = async () => {
  try {
    const app = createApp();

    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`
🚀 Server is running
Environment: ${config.env}
Port: ${config.port}
Health check: /health
API Base: http://localhost:${config.port}/api`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.logError(error, null, 'Failed to start server');
    process.exit(1);
  }
};

startServer();