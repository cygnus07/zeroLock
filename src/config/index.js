import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),  
  DATABASE_NAME: z.string().default('zerolock_dev'),
  DATABASE_USER: z.string().default('zerolock_user'),
  DATABASE_PASSWORD: z.string(),
  DATABASE_SSL: z.coerce.boolean().default(false),
  
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
});

console.log('🔍 Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

let envVars;
try {
  envVars = envSchema.parse(process.env);
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error('❌ Environment validation failed:', error.errors);
  process.exit(1);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  
  cors: {
    origin: envVars.NODE_ENV === 'production' 
      ? envVars.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too many requests, please try again later.',
    },
  },
  database: {
    host: envVars.DATABASE_HOST,
    port: envVars.DATABASE_PORT,
    name: envVars.DATABASE_NAME,
    user: envVars.DATABASE_USER,
    password: envVars.DATABASE_PASSWORD,
    ssl: envVars.DATABASE_SSL
  }
};