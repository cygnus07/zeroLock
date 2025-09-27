import { createApp } from "./app.js"
import { createServer} from 'http'
import config from './config/config.js'
import logger from "./utils/logger.js"


process.on('uncaughtException', (err) => {
    console.log("Uncaugh Exception: ", err)
    process.exit(1)
})

process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection', err)
    process.exit(1)
})


const startServer = () => {
    try {
        const app = createApp()
        const httpServer = createServer(app)
        const port = config.port || 4001
        httpServer.listen(port, "0.0.0.0", () => {
            logger.info(`
                Server is running
                port: ${port}
                health check: /health`)
        })

        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully')
            httpServer.close(() =>  {
                console.log('Server closed')
                process.exit(0)
            })
        })
    } catch (error) {
        console.error('Failed to start the server', error)
        process.exit(1)
    }
}

startServer()