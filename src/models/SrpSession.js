import logger from "../utils/logger"


class SrpSession {
    static SESSION_DURATION = 5 * 60 * 1000
    
    static async create(userId, srpB) {
        await this.deleteByUserId(userId) // clean up existing session
        // prepare the sql query 
        // execute the query with userId and srpB as paramters

        const sql = `
            insert into srp_sessions (user_id, srp_b, expires_at)
            values ($1, $2, now() + interval ' 5minutes')
            returning id, user_id, srp_b, expires_at
        `

        const result = await query(sql, [userId, srpB])
        logger.logDatabase('SRP Session Created', {
            userId,
            sessionId: result.rows[0].id
        })

        return result.rows[0]
    }   

    static async findById(sessionId) {
        const sql = `
            select id, user_id, srp_b, session_key, expires_at, created_at
            from srp_sessions
            where id = $1 and expires_at > now()
        `
        const result = await query(sql, [sessionId])
        return result.rows[0] || null
    }

    static async findByUserId(userId) {}

    static async updateSessionKey(sessionId, sessionKey) {}

    static async verify(sessionId, sessionKey) {}

    static async delete(sessionId) {}

    static async deleteByUserId(userId) {}

    static async cleanupExpired() {}

    static async extendSession(sessionId) {}

    static async getActiveSessionCount() {}

    static async getSessionInfo(sessionId) {}


}

export default SrpSession