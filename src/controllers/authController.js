import User from '../models/User.js'
import logger from '../utils/logger'
import SecurityLog from '../models/SecurityLog.js'
import CryptoService from '../services/cryptoService'
import SrpService from '../services/srpService.js'
import SrpSession from '../models/SrpSession.js'

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

    static async loginInit(req, res, next) {
        try {
            const { identifier } = req.body
            const user = await User.findByIdentifier(identifier)
            if(!user){
                await SecurityLog.logRequest(req, SecurityLog.ACTIONS.LOGIN_ATTEMPT, false, {
                    identifier,
                    reason: 'user not found'
                })
                throw new AppError('Invalid credentials', 401, true)
            }

            if(user.account_locked){
                await SecurityLog.logRequest(req, SecurityLog.ACTIONS.LOGIN_ATTEMPT, false, {
                    userId: user.id,
                    reason: 'Account locked'
                })

                throw new AppError(
                    `Account is locked due to multiple login attempts`,
                    423,
                    true
                )
            }


            const srpParams = await SrpService.startAuthentication(
                user.email,
                user.srp_salt,
                user.srp_verifier
            )

            const session = await SrpSession.create(user.id, srpParams.serverSecretKey)
            await SecurityLog.logRequest(req, SecurityLog.ACTIONS.LOGIN_ATTEMPT, true, {
                userId: user.id,
                phase: 'init'
            })

            res.json({
                success: true,
                data: {
                    sessionId: session.id,
                    serverPublicKey: srpParams.serverPublicKey,
                    salt: srpParams.salt
                }
            })
        } catch (error) {
            next(error)
        }
    }

    static async loginVerify(req, res, next) {
        try {
            const {
                sessionId,
                clientPublicKey,
                clientProof
            } = req.body

            const srpSession = await SrpSession.findById(sessionId)
            if(!srpSession){
                throw new AppError('Invalid or expired session', 401, true)
            }

            const user = await User.findById(srpSession.user_id)
            if(!user){
                throw new AppError('User not found', 404, true)
            }

            const verification = SrpService.verifyClientProof({
                clientPublicKey,
                clientProof,
                serverSecretKey: srpSession.srp_b,
                verifier: user.srp_verifier,
                salt: user.srp_salt,
                email: user.email
            })

            if(!verification.verified) {
                await User.incrementFailedLoginAttempts(user.id)
                await SecurityLog.logRequest(req, SecurityLog.ACTIONS.LOGIN_FAILED, false, {
                    userId: user.id,
                    reason: 'Invalid proof'
                })

                throw new AppError('Invalid credentials', 401, true)
            }

            await User.resetFailedLoginAttempts(user.id)
            await User.updateLastLogin(user.id)
            await SrpSession.delete(sessionId)

            const token = 'jwt placeholder'

            await SecurityLog.logRequest(req, SecurityLog.ACTIONS.LOGIN_SUCCESS, true, {
                userId: user.id
            })

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username
                    },
                    token,
                    serverProof: verification.serverProof,
                    message: 'Login successful'
                }
            })

        } catch (error) {
            next(error)
        }
    }

 
}


export default AuthController