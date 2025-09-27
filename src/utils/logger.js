import path from 'path'
import { fileURLToPath } from 'url'
import winston from 'winston'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
console.log(__filename, __dirname)


const logDir = path.join(__dirname, '../../', config.logging.dir)
    if(!fs.existsSync(logDir)){
        fs.mkdirSync(logDir, { recursive: true})
    }


const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
}

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray'
}

winston.addColors(colors)

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm::ss'}),
    winston.format.errors({ stack: true}),
    winston.format.splat(),
    winston.format.json()
)

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true}),
    winston.format.timestamp({ format: 'HH:mm:ss'}),
    winston.format.printf(({ timestamp, level, message, ...meta}) => {
        let msg = `${timestamp} [${level}: ${message}]`
        if(Object.keys(meta).length > 0){
            msg+= `${JSON.stringify(meta,null,2)}`
        }
        return msg
    })
)


const transports = [
    new winston.transports.Console({
        format: config.env === 'development' ? consoleFormat : logFormat,
        level: config.env === 'development' ? 'debug' : 'info'
    })
]

if(config.env !== 'development'){
    new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5
    })

    new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles:5
    })
}


const logger = winston.createLogger({
    level: config.loggin.level,
    levels,
    format: logFormat,
    transports,
    exitOnError: false

})


logger.stream = {
    write: (message) => {
        logger.http(message.trim())
    }
}


logger.logRequest = (req, message, meta) => {}

logger.logError = (error, req=null, message_= 'Error occured') => {}

logger.logSecurity = (event, details = {}) => {}

logger.logDatabase  = (operation, details = {}) => {}


export default logger