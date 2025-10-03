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

  
}

export default SrpService