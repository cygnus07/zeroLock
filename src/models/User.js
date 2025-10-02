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
            insert into users(
                email, username, srp_salt, srp_verifier,
                vault_key_encrypted, public_key, private_key_encrypted
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

    static async incrementFailedLoginAttempts(userId) {
        // prepare the sql query
        // execute the query with userId as parameter
        // destructure the result to get failed_login attemps and ccount_locked
        // if account locked give error else return result
        const sql = `
            update users
            set 
                failed_login_attempts = failed_login_attempts +1,
                last_failed_login = current_timestamp,
                account_locked = case
                    when failed_login_attempts >= 4 then true
                    else false
                end
            where id = $1
            returning failed_login_attempts, account_locked
    `
        const result = await query(sql, [userId])
        const { failed_login_attempts, account_locked} = result.rows[0]
        if(account_locked){
            logger.logSecurity('Account Locked', {
                userId,
                reason: 'Too many failed login attempts',
                attempts: failed_login_attempts
            })
        }

        return result.rows[0]
    }

    static async resetFailedLoginAttempts(userId) {
        const sql = `
            update users
            set
                failed_login_attempts = 0,
                last_failed_login = null,
                account_locked = false
            where id = $1
        `
        await query(sql,[userId])
    }

    static async isAccountLocked(userId) {
        const sql = 'select account_locked from users where id = $1'
        const result = await query(sql, [userId])
        return result.rows[0]?.account_locked || false
    }

    static async updateVaultKey(userId, vaultKeyEncrypted) {
        const sql = `
            update users
            set vault_key_encrypted = $1
            where id = $2
        `
        await query(sql, [vaultKeyEncrypted, userId])
        logger.logSecurity('Vault Key Updated', { userId })
    }

    static async updateKeys(userId, { publicKey, privateKeyEncrypted }) {
        const sql = `
            update users
            set
                public_key = $1,
                private_key_encrypted = $2
            where id = $3
        `
        await query(sql, [publicKey, privateKeyEncrypted, userId])
        logger.logSecurity('user Keys updted', { userId})
    }

    static async updateSrpVerifier(userId, { srpSalt, srpVerifier}) {
        const sql = `
            update users
            set
                srp_salt = $1,
                srp_verifier = $2
            where id = $3
        `
        await query(sql, [srpSalt, srpVerifier, userId])
        logger.logSecurity('Srp verifier updated', {userId})
    }

    static async delete(userId) {
        const sql = 'delete from users where id = $1 returning email, username'
        const result = await query(sql, [userId])
        if(result.rows[0]){
            logger.logSecurity('Account Deleted', {
                userId,
                email: result.rows[0].email,
                username: result.rows[0].username
            })
        }

        return result.rows[0]
    }

    static async search(searchTerm, limit = 10) {
        const sql = `
            select id, email, username, created_at
            from users
            where
                email ilike $1 or
                username ilike $1
            order by created_at desc
            limit $2
        `
        const result = await query(sql, [`%${searchTerm}%`, limit])
        return result.rows
    }

    static async getTotalCount() {
        const sql = 'select count(*) as count from users '
        const result = await query(sql)
        return parseInt(result.rows[0].count)
    }


}


export default User