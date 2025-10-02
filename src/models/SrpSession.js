import { config } from "../config"
import logger from "../utils/logger"
import { query } from '../utils/database.js'


class SrpSession {
    static SESSION_DURATION = 5 * 60 * 1000
    
    static async create(userId, srpB) {
        await this.deleteByUserId(userId) // clean up existing session
        // prepare the sql query 
        // execute the query with userId and srpB as paramters

        const sql = `
            insert into srp_sessions (user_id, srp_b, expires_at)
            values ($1, $2, now() + interval '5 minutes')
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

    static async findByUserId(userId) {
        const sql = `
            select id, user_id, srp_b, session_key, expires_at, created_at
            from srp_sessions
            where user_id = $1 and expires_at > now()
            order by created_at desc
            limit 1
        `
        const result = await query(sql, [userId])
        return result.rows[0] || null
    }

    static async updateSessionKey(sessionId, sessionKey) {
        const sql = `
            update srp_sessions
            set session_key = $1
            where id = $2 and expires_at > now()
            returning id
        `
        const result = await query(sql, [sessionKey, sessionId])
        if(result.rows.length === 0){
            throw new Error('Session not found or expired')
        }
        return result.rows[0]
    }

    static async verify(sessionId, sessionKey) {
        const sql = `
            select user_id
            from srp_sessions
            where id = $1 and session_key = $2 and expires_at > now()
        `

        const result = await query(sql, [sessionId, sessionKey])
        if(result.rows.length === 0){
            return null
        }

        await this.delete(sessionId)
        return result.rows[0].user_id
    }

    static async delete(sessionId) {
        const sql = 'delete from srp_sessions where user_id = $1'
        await query(sql, [sessionId])
    }

    static async deleteByUserId(userId) {
        const sql = 'delete from srp_sessions where user_id = $1'
        await query(sql, [userId])
    }

     static async cleanupExpired() {
        const sql = `
            DELETE FROM srp_sessions
            WHERE expires_at < NOW()
        `

        const result = await query(sql)
        const deletedCount = result.rowCount || 0
        
        if(deletedCount > 0){
            logger.info('Cleaned up expired SRP sessions', { count: deletedCount })
        }
        
        return deletedCount
    }

    static async extendSession(sessionId) {
        const sql = `
            update srp_sessions
            set expires_at = now() + interval '5 minutes'
            where id = $1 and expires_at > now()
            returning expires_at
        `

        const result = await query(sql, [sessionId])
        if(result.rows.length === 0){
            throw new Error('Session not found or already expired')
        }

        return result.rows[0].expires_at
    }

    static async getActiveSessionCount() {
        const sql = `
            select count(*) as count
            from srp_sessions
            where expires_at > now()
        `
        const result = await query(sql)
        return parseInt(result.rows[0].count)
    }

    static async getSessionInfo(sessionId) {
        const sql = `
            select
                s.id,
                s.user_id,
                s.created_at,
                s.expires_at,
                u.email,
                u.username
            from srp_sessions s
            join users u on s.user_id = u.id
            where s.id = $1 and s.expires_at > now()
        `

        const result = await query(sql, [sessionId])
        return result.rows[0] || null
    }


}

if(config.env !== 'test'){
    setInterval( () => {
        SrpSession.cleanupExpired().catch(err => 
            logger.error('Failed to cleanup expired sessions', { error: err.message})
        )
    }, 10*60*1000)
}

export default SrpSession