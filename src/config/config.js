import dotenv from 'dotenv'
dotenv.config()

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 4001,
    logging: {
        level: process.env.LOG_LEVEL || 'debug',
        dir: process.env.LOG_DIR || 'logs'
    }
}

export default config