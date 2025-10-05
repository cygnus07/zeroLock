import logger from "../utils/logger.js"
import CryptoService from "./cryptoService.js"
import srp from 'secure-remote-password/server.js'

class SrpService {
    static async generateRegistrationParams(email, password) {
        // generate a unique salt for the user
        // use email as the unique identity
        // generate  verifier using the salt, identity and password
        // return salt and verifier
        try {
            const salt = await CryptoService.generateSalt()
            const identity = email.toLowerCase()
            const verifier = srp.deriverVerifier({
                salt,
                identity,
                password,
            })

            logger.debug('Srp registration params generated', {
                email,
                saltLength: salt.length,
                verifierLength: verifier.length
            })

            return {salt, verifier}
        } catch (error) {
            logger.error('Failed to generate srp registration params', {
                error: error.message
            })
            throw error
        } 
    }

    static async startAuthentication(email, salt, verifier) {
        // generate the key pair
        // generate session id to track the login attempt
        // return the sessionid, serverPublickey and serversecretekey
        try {
            const serverEphemeral = srp.generateEphemeral(verifier)
            const sessionId = CryptoService.generateSessionId()
    
            logger.debug('Srp authentication started', {
                email, 
                sessionId,
                serverPublicKeyLength: serverEphemeral.public.length
            })
    
            return {
                sessionId,
                serverPublicKey: serverEphemeral.public,
                serverSecretKey: serverEphemeral.secret,
                salt,
            }
        } catch (error) {
            logger.error('Failed to start srp authentication', {
                error: error.message,
                email
            })

            throw error
        }
        
    }

 
}

export default SrpService