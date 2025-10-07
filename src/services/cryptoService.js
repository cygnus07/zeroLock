import crypto from 'crypto'
import { promisify } from 'util'

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

    static async generateSecureToken(length = 32) {
        const bytes = await randomBytes(length)
        return bytes.toString('base64url')
    }

    static async generateRandomBytes(length) {
        return randomBytes(length)
    }

    static hash256(data){
        return crypto
            .createHash('sha256')
            .update(data)
            .digest('hex')
    }

    static hash512(data) {
        return crypto
            .createHash('sha512')
            .update(data)
            .digest('hex')
    }

    static hmac256(key, data) {
        return crypto
            .createHmac('sha256', key)
            .update(data)
            .digest('hex')
    }

    static async generateKeyPair() {
          return new Promise((resolve, reject) => {
            crypto.generateKeyPair('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
                },
                privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                },
            }, (err, publicKey, privateKey) => {
                if (err) reject(err);
                else resolve({ publicKey, privateKey });
            });
        });   
    }

    static encrypt(plaintext, key) {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex'),
            iv
        )

        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final()
        ])

        const tag = cipher.getAuthTag()

        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64')
        }
    }

    static decrypt(encryptedData, key, iv, tag) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex'),
            Buffer.from(iv, 'base64')
        )

        decipher.setAuthTag(Buffer.from(tag, 'base64'))

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedData, 'base64')),
            decipher.final()
        ])

        return decrypted.toString('utf8')
    }

    static encryptWithPublicKey(publicKey, data) {
        const encrypted = crypto.publicEncrypt(
            {   
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(data, 'utf8')
        )
        return encrypted.toString('base64')
    }

    static decryptWithPrivateKey(privateKey, encryptedData) {
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(encryptedData, 'base64')
        )
        return decrypted.toString('utf8')
    }

    static getKeyFingerprint(publicKey) {
        return this.hash256(publicKey).substring(0, 16)
    }


}

export default CryptoService