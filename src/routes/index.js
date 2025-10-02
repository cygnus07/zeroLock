import { Router } from 'express';
import { checkConnection } from '../utils/database.js';
import { config } from '../config/index.js';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/health', async (_req, res) => {
  try {
    const dbConnected = await checkConnection()
    const health = {
      status: dbConnected ? 'healthy': 'unhealthy',
      timestamp: new Date().toISOString,
      uptime: process.uptime(),
      environment: config.env || 'development',
      database: {
        connected: dbConnected,
        status: dbConnected ? 'connected' : 'disconnected',
      }
    }

    res.status(dbConnected ? 200 : 503).json(health)
  } catch (error) {
    logger.error('Health check failed', { error: error.message})
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'health check failed'
    })
  }
})



export default router;