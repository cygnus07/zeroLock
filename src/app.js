import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

dotenv.config()


export const createApp = () => {
    const app = express()

    app.use(cors())
    app.use(helmet())
    app.use(express.urlencoded({
        extended: true,
        limit: '10mb'
    }))
    app.use(express.json({ limit: '10mb'}))
    app.use(cookieParser())

    if(process.env.NODE_ENV === 'development'){
        app.use(morgan('dev'))
    }


    app.get('/', (req,res) => {
        res.status(200).json({
            status: 'ok',
            message: 'Api is running'
        })    
    })

    app.get('/health', (req,res) => {
        res.status(200).json({
            status:'ok',
            timeStamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        })
    })

    return app

}