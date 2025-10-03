import crypto from 'crypto'

const randomBytes = promisify(crypto.randomBytes)

class CryptoService {
    static async generateSalt() {
        // generate random 32 bytes and return hex string
        const saltBytes = await randomBytes(32)
        return saltBytes.toString('hex')
    }
}

export default CryptoService