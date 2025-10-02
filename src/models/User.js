import { query } from "../utils/database"
import logger from "../utils/logger"


class User {
    static async create(userData) {
        // destructure the data from userdata
        // create a sql string literal and values array
        // call query function from database utility file
        // log the data and the errors

        const {
            email,
            username,
            srpSalt,
            srpVerifier,
            vaultKeyEncrypted,
            publicKey,
            privateKeyEncrypted
        } = userData

        const sql = `
            insert values users(
                email, username, srp_salt, srp_verifier,
                vault_key_encrypted, pubic_key, private_key_encrypted
            ) values ( $1, $2, $3, $4, $5, $6, $7)
             returning id, email, username, created_at
        `
        const values = [
            email.toLowerCase(),
            username,
            srpSalt,
            srpVerifier,
            vaultKeyEncrypted,
            publicKey,
            privateKeyEncrypted
        ]

        try {
            const result = await query(sql, values)
            logger.logSecurity('User Created', {
                userId: result.rows[0].id, email
            })
            return result.rows[0]
        } catch (error) {
            if(error.code === '23505'){
                if(error.detail.includes('email')){
                    throw new Error('Email already exists')
                }
                if(error.detail.includes('username')){
                    throw new Error('Username already exists')
                }
            }
            throw error
        }
    }

    static async findById(id) {}

    static async findByEmial(email) {}

    static async findByUsername(username) {}

    static async findByIdentifier(identifier) {}

    static async checkEmailExists(email) {}

    static async checkUsernameExists(username) {}

    static async updateLastLogin(userId) {}

    static async incrementFailedLoginAttempts(userId) {}

    static async resetFailedLoginAttempts(userId) {}

    static async isAccountLocked(userId) {}

    static async updateVaultKey(userId, vaultKeyEncrypted) {}

    static async updateKeys(userId, { publicKey, privateKeyEncrypted }) {}

    static async updateSrpVerifier(userId, { srpSalt, srpVerifier}) {}

    static async delete(userId) {}

    static async search(serachTerm, limit = 10) {}

    static async getTotalCount() {}


}


export default User