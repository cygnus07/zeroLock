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

    static verifyClientProof({
        clientPublicKey,
        clientProof,
        serverSecretKey,
        verifier,
        salt,
        email
    }) {
        // derive the shared session key
        // verify client's proof
        // generate the server's proof for mutual auth
        try {
            const sessionKey = srp.deriveSession({
                clientPublicKey,
                serverSecretKey,
                verifier,
                salt,
                identity: email.toLowerCase()
            })

            const isValid = CryptoService.secureCompare(
                clientProof,
                sessionKey.proof
            )

            if(!isValid){
                logger.warn('Invalid client proof', { email })
                return { verified: false}
            }

            const serverProof = sessionKey.proof
            logger.debug('Srp verification successful', { email })
            return {
                verified: true,
                serverProof,
                sessionKey: sessionKey.key
            }
        } catch (error) {
            logger.error('Srp verification failed', {
                error: error.message,
                email
            })
            return { verified: false}
        }
    }

    static validateParams(salt, verifier) {
         if (!salt || !/^[0-9a-f]{64}$/i.test(salt)) {
      logger.warn('Invalid SRP salt format')
      return false;
    }

    // Verifier should be a valid hex string
    if (!verifier || !/^[0-9a-f]+$/i.test(verifier)) {
      logger.warn('Invalid SRP verifier format')
      return false
    }

    // Verifier should be reasonable length (typically 512 chars for 2048-bit)
    if (verifier.length < 256 || verifier.length > 1024) {
      logger.warn('Invalid SRP verifier length', { length: verifier.length });
      return false
    }

    return true
    }

   
}

export default SrpService