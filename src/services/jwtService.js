import CryptoService from "./cryptoService.js"


class JwtService {
    static generateTokens(payload) {
        const tokenId = CryptoService.generateSessionId()

        const tokenPayload = {
            ...payload,
            tokenId,
            type: 'access',
            iat: Math.floor(Date.now() /1000)
        }

        const accessToken = jwt.sign(
            tokenPayload,
            config.jwt.secret,
            {
                expiresIn: config.jwt.expiresIn,
                algorith: 'HS256'
            }
        )

        const refreshPayload = {
            userId: payload.userId,
            tokenId,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000)
        }

        const refreshToken = jwt.sign(
            refreshPayload,
            config.jwt.refreshSecret,
            {
                expiresIn: config.jwt.refreshExpiresIn,
                algorithm: 'HS256'
            }
        )

        const expiresIn = this.getExpirationTime(config.jwt.expiresIn)
        logger.debug('JWT tokens generated', {
            userId: payload.userId,
            tokenId,
            expiresIn,
        })

        return {
            accessToken,
            refreshToken,
            expiresIn,
            tokenType: 'Bearer'
        }
    }

    static verifyAccessToken(token) {}

    static verifyRefreshToken(token) {}

    static refreshAccessToken(refreshToken, user) {}

    static extractToken(authHeader) {}

    static getExpirationTime(expiresIn) {}

    static decodeToken(token) {}

    static generateResetToken(userId, email) {}

    static verifyResetToken(token) {}

    static generateEmailVerificationToken(userId, email) {}

    static verifyEmailToken(token) {}


}

export default JwtService