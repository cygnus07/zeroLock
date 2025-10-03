import logger from '../utils/logger.js'

export const validate = (schema, property = 'body') => {
    return (req,res,next) => {
        try {
            const validated = schema.parse(req[property])
            req[property] = validated
            logger.debug(`Validation passed for ${req.method} ${req.path}`, {
                property,
                validateFields: Object.keys(validated)
            })

            next()
        } catch (error) {
            if(error.name === 'ZodError') {
                const errors =error.errors.map(err => ({
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

export const validateOptional = (schema, property = 'body') => {}

export const validateMultiple = (validations) => {}

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

export const validateFile = (options = {}) => {}

export const authValidation = {
    body: (schema) => validate(schema, 'body'),
    query: (schema) => validate(schema, 'query'),
    params: (schema) => validate(schema, 'params')
}


