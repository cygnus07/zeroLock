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

    static async findById(id) {
        // prepare the sql query to select a user by id
        // execute the query with the provided is as parameter
        // return the record if user found, else return null

        const sql = `
            select
             id, email, username, srp_salt, srp_verifier, vault_key_encrypted, public_key,
             private_key_encrypted, account_locked, failed_login_attempts,
             last_failed_login, created_at, updated_at, last_login
            from users
            where id = $1
        `

        const result = await query(sql, [id])
        return result.rows[0] || null
    }

    static async findByEmail(email) {
        // prepare sql query to select a user by email
        // normalize the email to lowercase
        // execute the query with the email as param
        // return the user if fond, else return null
        const sql = `
            select
             id, email, username, srp_salt, srp_verifier, vault_key_encrypted, public_key,
             private_key_encrypted, account_locked, failed_login_attempts,
             last_failed_login, created_at, updated_at, last_login
            from users
            where email = $1
        `

        const result = await query(sql, [email.toLowerCase()])
        return result.rows[0] || null
    }

    static async findByUsername(username) {
        // prepare the sql query to select user by username
        // execute the query with username as paramerter
        // resturn the user if found else return null
        const sql = `
            select
             id, email, username, srp_salt, srp_verifier, vault_key_encrypted, public_key,
             private_key_encrypted, account_locked, failed_login_attempts,
             last_failed_login, created_at, updated_at, last_login
            from users
            where username = $1
        `
        const result = await query(sql, [username])
        return result.rows[0] || null
    }

    static async findByIdentifier(identifier) {
        // check if the identifier is email or username
        // call the matching functions to get the user
        const isEmail = identifier.includes('@')
        return isEmail 
        ? await this.findByEmail(identifier)
        : await this.findByUsername(identifier)
    }

    static async checkEmailExists(email) {
        // prepare the sql query 
        // execute te query with the sql and email
        const sql = ' select 1 from users where email = $1 limit 1'
        const result = await query(sql, [email.toLowerCase()])
        return result.rows.length > 0
    }

    static async checkUsernameExists(username) {
        const sql = 'select 1 from users where username = $1 limit 1'
        const result = await query(sql, [username])
        return result.rows.length > 0
    }

    static async updateLastLogin(userId) {
        const sql = `
            update users
            set last_login = current_timestamp
            where id = $1
            returning last_login
        `
        const result = await query(sql, [userId])
        return result.rows[0]
    }

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