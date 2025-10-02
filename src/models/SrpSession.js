

class SrpSession {
    static SESSION_DURATION = 5 * 60 * 1000
    
    static async create(userId, srpB) {}

    static async findById(sessionId) {}

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