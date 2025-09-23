import { createApp } from "./app.js"
import { createServer} from 'http'
import dotenv from 'dotenv'

dotenv.config()

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
        const port = process.env.PORT || 4001
        httpServer.listen(port, "0.0.0.0", () => {
            console.log(`
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