import User from '../models/User.js'
import logger from '../utils/logger'
import SecurityLog from '../models/SecurityLog.js'
import CryptoService from '../services/cryptoService'
import SrpService from '../services/srpService.js'

class AuthController {
    static async checkAvailability(req,res,next) {
        try {
            const { email, username} = req.body
            const result = {
                email: null,
                username: null,
            }

            if(email) {
                const emailExists = await User.checkEmailExists(email)
                result.email = {
                    available: !emailExists,
                    value: email
                }
            } 

            if(username) {
                const usernameExists = await User.checkUsernameExists(username)
                result.username = {
                    available: !usernameExists,
                    value: username
                }
            }

            res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            next(error)
        }
    }

    static async registerInit(req,res, next) {
        try {
            const {email, username} = req.body
            const emailExists = await User.checkEmailExists(email)
            if(emailExists) {
                throw new AppError('Email already registered', 409, true)
            }

            const usernameExists = await User.checkUsernameExists(username)
            if(usernameExists) {
                throw new AppError('username already taken', 409, true)
            }

            const registerationToken = await CryptoService.generateSecureToken()

            await SecurityLog.logRequest(req, 'user_registration_init', true, {
                email,
                username
            })

            res.json({
                success: true,
                data: {
                    registerationToken,
                    message: 'Registration initialized, please complete registration with srp parameters'
                }
            })
        } catch (error) {
            await SecurityLog.logRequest(req, 'User_registration_init', false, {
                error: error.message
            })
            next(error)
        }
    }

    static async registerComplete(req, res, next) {
        try {
            const {
                email,
                username,
                srpSalt,
                srpVerifier,
                vaultKeyEncrypted,
                publicKey,
                privateKeyEncrypted
            } = req.body

            if(!SrpService.validateParams(srpSalt, srpVerifier)){
                throw new AppError('Invalid srp parameters', 400, true)
            }

            const emailExists = await User.checkEmailExists(email)
            if(emailExists){
                throw new AppError('Email already registered', 409, true)
            }

            const usernameExists = await User.usernameExists(username)
            if(usernameExists){
                throw new AppError('Username already taken', 409, true)
            }

            const user = await User.create({
                email,
                username,
                srpSalt,
                srpVerifier,
                vaultKeyEncrypted,
                publicKey,
                privateKeyEncrypted
            })

            await SecurityLog.logRequest(req, SecurityLog.ACTIONS.USER_CREATED, true, {
                userId: user.id,
                email: user.email,
                username: user.username
            })

            logger.info('New user registered'., {
                userId: user.id,
                email: user.email,
                username: user.username
            })

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        createdAt: user.created_at
                    },
                    message: 'Registration successfull, user can login now'
                }
            })
        } catch (error) {
            await SecurityLog.logRequest(req, SecurityLog.ACTIONS.USER_CREATED, false, {
                error: error.message,
                email: req.body.email,
            })

            next(error)
        }
    }

   


export default AuthController