import crypto from 'crypto'

const randomBytes = promisify(crypto.randomBytes)

class CryptoService {
    static async generateSalt() {
        // generate random 32 bytes and return hex string
        const saltBytes = await randomBytes(32)
        return saltBytes.toString('hex')
    }

    static generateSessionId() {
        return crypto.randomUUID()
    }

    static secureCompare(a,b) {
        if(a.length !== b.length) return false
        return crypto.timingSafeEqual(
            Buffer.from(a),
            Buffer.from(b)
        )
    }

    static async deriveKey(password, salt, iterations = 100000, keyLength = 32) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, iterations, keyLength, 'sha256', (err, derivedKey) => {
                if(err) reject(err)
                else resolve(derivedKey.toString('hex'))
            })
        })
    }
}

export default CryptoService