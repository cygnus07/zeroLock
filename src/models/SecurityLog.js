import { query } from "../utils/database"


class SecurityLog {
    static ACTIONS = {
        // auth
        LOGIN_ATTEMPT: 'login_attemp',
        LOGIN_SUCCESS: 'login_success',
        LOGIN_FAILED: 'login_failed',
        LOGOUT: 'logout',

        // accout mgmt
        USER_CREATED: 'user_created',
        ACCOUNT_LOCKED: 'account_locked',
        ACCOUNT_UNLOCKED: 'account_unlocked',
        ACCOUNT_DELETED: 'account_deleted',
        PASSWORD_CHANGED: 'password_changed',

        // vault ops
        VAULT_ACCESSED: 'vault_accessed',
        VAULT_KEY_UPDATED: 'vault_key_updated',
        VAULT_ITEM_CREATED: 'vault_item_created',
        VAULT_ITEM_DELETED: 'vault_item_deleted',
        VAULT_ITEM_SHARED: 'vault_item_shared',

        // security events
        SUSPICIOUS_ACTIVITY: 'suspicious_activity',
        RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
        INVALID_TOKEN: 'invalid_token',
        BREACH_CHECK: 'breach-check'
    }

    static async log({
        userId = null,
        action,
        success = true,
        ipAddress = null,
        userAgent = null,
        details = {}
    }) {
        const sql = `
            insert into security_logs
                (user_id, action, success, ip_address, user_agent, details)
            values ($1, $2, $3, $4, $5, $6)
            returning id, timestamp
        `

        const values = [
            userId,
            action,
            success,
            ipAddress,
            userAgent,
            JSON.stringify(details)
        ]

        const result = await query(sql, values)
        return result.rows[0]
    }

    static async findByUserId(userId, { limit=50, offset=0} = {}) {
        const sql = `
            select 
                id, user_id, action, success, ip_address,
                user_agent, details, timestamp
            from security_logs
            where user_id = $1
            ordery by timestamp desc
            limit $2 offset $3
        `

        const result = await query(sql, [userId, limit, offset])
        return result.rows
    }

    static async findByAction(action, { limit=50, offset = 0} = {}) {
        const sql = `
            select
                id, user_id, action, succes, ip_address,
                user_agent, details, timestamp
            from security_logs
            where action = $1
            order by timestamp desc
            limit $2 offset $3
        `

        const result = await query(sql, [action, limit, offset])
        return result.rows
    }

    static async getFailedLoginAttempts(userId, hours = 24) {
        const sql = `
            select count(*) as count
            from security_logs
            where 
                user_id = $1
                and action = $2
                and success = false
                and timestamp > now() - interval '${hours} hours'
        `

        const result = await query(sql, [userId, this.ACTIONS.LOGIN_ATTEMPT])
        return parseInt(result.rows[0].count)
    }
}


export default SecurityLog