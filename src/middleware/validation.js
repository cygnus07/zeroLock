import logger from '../utils/logger.js'
import { AppError } from '../utils/errors.js'

export const validate = (schema, property = 'body') => {
    return (req,res,next) => {
        try {
            const validated = schema.parse(req[property])
            req[property] = validated
            logger.debug(`Validation passed for ${req.method} ${req.path}`, {
                property,
                validatedFields: Object.keys(validated)
            })

            next()
        } catch (error) {
            if(error.name === 'ZodError') {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }))

                logger.warn('Validation failed', {
                    method: req.method,
                    path: req.path,
                    property,
                    errors,
                    ip: req.ip
                })

                throw new AppError(
                    'Validation failed',
                    400,
                    true,
                    { errors }
                )
            }

            throw error
        }
    }
}

export const validateOptional = (schema, property = 'body') => {
    return (req,res,next) => {
        try {
            const result = schema.safeParse(req[property])
            if(result.success){
                req[property] =result.data
                req.validationPassed = true
            } else {
                req.validationErrors = result.error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }))
                req.validationPassed = false
            }
            next()
        } catch (error) {
            logger.error('Optional validation error', {
                error: error.message,
                method: req.method,
                path: req.path,
            })

            next()
        }
    }
}

export const validateMultiple = (validations) => {
    return async (req,res, next) => {
        try {
            for(const { schema, property = 'body' } of validations) {
                const validated = schema.parse(req[property])
                req[property] = validated
            }
            next()
        } catch (error) {
            if(error.name === 'ZodError'){
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }))

                throw new AppError(
                    'Validation failed',
                    400,
                    true,
                    {errors}
                )
            }

            throw error
        }
    }
}

export const sanitize = (fields = []) => {
    return (req,res,next) => {
        const sanitizeValue = (value) => {
            if(typeof value !== 'string') return value

            return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }

        const sanitizeObject = (obj, fieldsToSanitize) => {
            fieldsToSanitize.forEach(field => {
                if(obj[field] !== undefined){
                    obj[field] = sanitizeValue(obj[field])
                }
            })
        }

        if(req.body) sanitizeObject(req.body, fields)
        if(req.query) sanitizeObject(req.query, fields)
        if(req.params) sanitizeObject(req.params, fields)

        next()
    }
}

export const requireContentType = (contentType = 'application/json') => {
    return (req,res,next) => {
        if(req.method === 'GET' || req.method === 'DELETE') {
            return next()
        }

        const receivedType = req.get('content-type')
        if(!receivedType || !receivedType.includes(contentType)){
            throw new AppError(
                `Content-Type must be ${contentType}`,
                415,
                true
            )
        }

        next()
    }
}

export const validateFile = (options = {}) => {
    const {
        maxSize = 5*1024*1024,
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
        required = false,
    } = options

    return(req,res,next) => {
        if(!req.file && required){
            throw new AppError('File is required', 400, true)
        }

        if(!req.file){
            return next()
        }

        if(req.file.size > maxSize){
            throw new AppError(
                `File size exceeds maximum allowed size of ${maxSize/1024/1024}MB`,
                400,
                true
            )
        }

        if(!allowedTypes.includes(req.file.mimetype)) {
            throw new AppError(
                `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
                400,
                true
            )
        }

        next()
    }
}

export const authValidation = {
    body: (schema) => validate(schema, 'body'),
    query: (schema) => validate(schema, 'query'),
    params: (schema) => validate(schema, 'params')
}


