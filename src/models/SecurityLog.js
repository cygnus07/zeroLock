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

    static async getRecentActivity(userId, days = 7) {
        const sql = `
            select 
                action,
                count(*) as count,
                max(timestamp) as last_occurence
            from security_logs
            where 
                user_id = $1
                and timestamp > now() - interval '${days} days'
            group by action
            order by last_occurence desc
        `

        const result = await query(sql, [userId])
        return result.rows
    }

    static async getSecurityStats(userId) {
        const sql = `
            select
                count(case when action = '{this.ACTIONS.LOGIN_SUCCESS}' then 1 end) as successful_logins,
                count(case when aciton = '${this.ACTIONS.LOGIN_FAILED}' then 1 end) as failed_logins,
                count(case when action = '${this.ACTIONS.SUSPICIOUS_ACTIVITY}' then 1 end) as suspicious_activities,
                count(distinct ip_address) as unique_ips,
                max(case when action = '${this.ACTIONS.LOGIN_SUCCESS}' then timestamp end) as last_login
            from security_logs
            where user_id = $1
        `

        const result = await query(sql, [userId])
        return result.rows[0]
    }


    static async findSuspiciousActivity({ limit = 100} = {}) {
        const sql = `
            select
                sl.*,
                u.email,
                u.username
            from security_logs sl
            left join users u on sl.user_id = u.id
            where 
                sl.action in ($1, $2, $3)
                or sl.success = false
            order by sl.timestamp desc
            limit $4
        `

        const values = [
            this.ACTIONS.SUSPICIOUS_ACTIVITY,
            this.ACTIONS.ACCOUNT_LOCKED,
            this.ACTIONS.RATE_LIMIT_EXCEEDED,
            limit
        ]

        const result = await query(sql, values)
        return result.rows
    }
}


export default SecurityLog