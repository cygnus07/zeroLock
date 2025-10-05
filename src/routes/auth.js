import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import AuthController from '../controllers/authController.js'
import { authSchemas, validate } from '../utils/validators.js'


const router = Router()

const authRateLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})

const checkRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})

router.post(
    '/check-availability',
    checkRateLimiter,
    validate(authSchemas.checkAvailability),
    AuthController.checkAvailability
)


router.post(
    '/register/init',
    authRateLimiter,
    validate(authSchemas.registerInit),
    AuthController.registerInit
)

router.post(
    '/register/complete',
    authRateLimiter,
    validate(authSchemas.registerComplete),
    AuthController.registerComplete
)


router.post(
    '/login/verify',
    authRateLimiter,
    validate(authSchemas.loginVerify),
    AuthController.loginVerify
)

router.post(
    '/logout',
    AuthController.logout
)


router.get(
    '/profile',
    AuthController.getProfile
)

export default router
