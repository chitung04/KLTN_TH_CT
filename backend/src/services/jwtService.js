const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
    constructor() {
        this.secret = process.env.JWT_SECRET;
        this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.issuer = 'thct-clinic';
        this.audience = 'thct-clinic-users';

        if (!this.secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
    }

    /**
     * Generate JWT token with user payload and 24h expiration
     * @param {Object} payload - User data { userId, email, role, fullName }
     * @returns {String} - JWT token
     */
    generateToken(payload) {
        try {
            const jti = this.generateTokenId(payload.userId);
            
            const tokenPayload = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                fullName: payload.fullName,
                jti: jti // JWT ID for token blacklisting support
            };

            const token = jwt.sign(
                tokenPayload,
                this.secret,
                {
                    expiresIn: this.expiresIn,
                    issuer: this.issuer,
                    audience: this.audience,
                    algorithm: 'HS256'
                }
            );

            return token;
        } catch (error) {
            throw new Error(`Token generation failed: ${error.message}`);
        }
    }

    /**
     * Verify JWT token signature and expiration
     * @param {String} token - JWT token to verify
     * @returns {Object} - Decoded token payload
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secret, {
                issuer: this.issuer,
                audience: this.audience,
                algorithms: ['HS256']
            });

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('TOKEN_EXPIRED');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('TOKEN_INVALID');
            }
            if (error.name === 'NotBeforeError') {
                throw new Error('TOKEN_NOT_ACTIVE');
            }
            throw new Error('TOKEN_ERROR');
        }
    }

    /**
     * Extract token from Authorization header
     * @param {String} authHeader - Authorization header value
     * @returns {String|null} - Token or null if not found
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }

    /**
     * Generate unique JWT ID for token blacklisting
     * @param {Number} userId - User ID
     * @returns {String} - Unique token ID
     */
    generateTokenId(userId) {
        const timestamp = Date.now();
        const randomBytes = crypto.randomBytes(8).toString('hex');
        return `${userId}_${timestamp}_${randomBytes}`;
    }

    /**
     * Decode token without verification (for debugging)
     * @param {String} token - JWT token
     * @returns {Object} - Decoded token payload
     */
    decodeToken(token) {
        try {
            return jwt.decode(token, { complete: true });
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if token is expired without verification
     * @param {String} token - JWT token
     * @returns {Boolean} - True if expired
     */
    isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            return Date.now() >= decoded.exp * 1000;
        } catch (error) {
            return true;
        }
    }

    /**
     * Get token expiration time
     * @param {String} token - JWT token
     * @returns {Date|null} - Expiration date
     */
    getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Refresh token by generating new one with same payload
     * @param {String} token - Current JWT token
     * @returns {String} - New JWT token
     */
    refreshToken(token) {
        try {
            const decoded = this.verifyToken(token);
            
            // Create new token with same payload but new expiration
            const newPayload = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                fullName: decoded.fullName
            };

            return this.generateToken(newPayload);
        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }
}

module.exports = new JWTService();