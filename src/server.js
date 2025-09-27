import { createApp } from "./app.js"
import { createServer} from 'http'
import config from './config/config.js'
import logger from "./utils/logger.js"


process.on('uncaughtException', (err) => {
    logger.error("Uncaugh Exception: ", err)
    process.exit(1)
})

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection', err)
    process.exit(1)
})


const startServer = () => {
    try {
        logger.info('Starting the api server')
        const app = createApp()
        const httpServer = createServer(app)
        const port = config.port || 4001
        httpServer.listen(port, "0.0.0.0", () => {
            logger.info(`
                Server is running
                port: ${port}
                Environment: ${config.env}
                health check: http://localhost:${port}/health`)
        })

        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully')
            httpServer.close(() =>  {
                logger.info('Server closed')
                process.exit(0)
            })
        })
    } catch (error) {
        logger.error('Failed to start the server', error)
        process.exit(1)
    }
}

startServer()