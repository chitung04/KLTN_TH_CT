const db = require('../config/database');

/**
 * Audit Logging Service for THCT Clinic Authentication System
 * Provides comprehensive security event logging for all authentication actions
 * 
 * Features:
 * - Log authentication events (login, logout, register)
 * - Track password changes and profile updates
 * - Monitor admin role changes and suspicious activities
 * - Store IP address, user agent, and timestamps
 * - Separate successful and failed attempts
 * 
 * Requirements validated: 10.1, 10.3, 10.4, 10.5
 */

class AuditService {
    /**
     * Log an authentication or security event
     * @param {Object} eventData - Event data to log
     * @param {Number} eventData.userId - User ID (null for failed attempts)
     * @param {String} eventData.action - Action type (login, logout, register, etc.)
     * @param {String} eventData.ipAddress - Client IP address
     * @param {String} eventData.userAgent - Browser user agent string
     * @param {Boolean} eventData.success - Whether action was successful
     * @param {String} eventData.details - Additional event details (JSON string)
     * @returns {Promise<Object>} - Inserted audit log record
     */
    async logEvent({ userId = null, action, ipAddress, userAgent, success = true, details = null }) {
        try {
            const query = `
                INSERT INTO auth_audit_logs 
                (user_id, action, ip_address, user_agent, success, details, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await db.execute(query, [
                userId,
                action,
                ipAddress || 'unknown',
                userAgent || 'unknown',
                success ? 1 : 0,
                details ? JSON.stringify(details) : null
            ]);

            return {
                id: result.insertId,
                userId,
                action,
                ipAddress,
                success,
                timestamp: new Date()
            };
        } catch (error) {
            // Don't throw errors for audit logging failures - log to console instead
            console.error('Audit logging failed:', error.message);
            return null;
        }
    }

    /**
     * Log successful login
     * @param {Number} userId - User ID
     * @param {String} email - User email
     * @param {Object} req - Express request object
     */
    async logSuccessfulLogin(userId, email, req) {
        return this.logEvent({
            userId,
            action: 'LOGIN_SUCCESS',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true,
            details: { email }
        });
    }

    /**
     * Log failed login attempt
     * @param {String} email - Attempted email
     * @param {String} reason - Failure reason
     * @param {Object} req - Express request object
     */
    async logFailedLogin(email, reason, req) {
        return this.logEvent({
            userId: null,
            action: 'LOGIN_FAILED',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: false,
            details: { email, reason }
        });
    }

    /**
     * Log user registration
     * @param {Number} userId - New user ID
     * @param {String} email - User email
     * @param {String} role - User role
     * @param {Object} req - Express request object
     */
    async logRegistration(userId, email, role, req) {
        return this.logEvent({
            userId,
            action: 'USER_REGISTRATION',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true,
            details: { email, role }
        });
    }

    /**
     * Log user logout
     * @param {Number} userId - User ID
     * @param {String} email - User email
     * @param {Object} req - Express request object
     */
    async logLogout(userId, email, req) {
        return this.logEvent({
            userId,
            action: 'LOGOUT',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true,
            details: { email }
        });
    }

    /**
     * Log password change
     * @param {Number} userId - User ID
     * @param {String} email - User email
     * @param {Boolean} success - Whether password change was successful
     * @param {Object} req - Express request object
     */
    async logPasswordChange(userId, email, success, req) {
        return this.logEvent({
            userId,
            action: success ? 'PASSWORD_CHANGE_SUCCESS' : 'PASSWORD_CHANGE_FAILED',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success,
            details: { email }
        });
    }

    /**
     * Log profile update
     * @param {Number} userId - User ID
     * @param {String} email - User email
     * @param {Array} changedFields - List of changed field names
     * @param {Object} req - Express request object
     */
    async logProfileUpdate(userId, email, changedFields, req) {
        return this.logEvent({
            userId,
            action: 'PROFILE_UPDATE',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true,
            details: { email, changedFields }
        });
    }

    /**
     * Log role change (admin action)
     * @param {Number} adminId - Admin user ID who made the change
     * @param {Number} targetUserId - User whose role was changed
     * @param {String} oldRole - Previous role
     * @param {String} newRole - New role
     * @param {Object} req - Express request object
     */
    async logRoleChange(adminId, targetUserId, oldRole, newRole, req) {
        return this.logEvent({
            userId: adminId,
            action: 'ROLE_CHANGE',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true,
            details: {
                adminId,
                targetUserId,
                oldRole,
                newRole
            }
        });
    }

    /**
     * Log suspicious activity
     * @param {Number|null} userId - User ID (if known)
     * @param {String} activityType - Type of suspicious activity
     * @param {Object} activityDetails - Details about the suspicious activity
     * @param {Object} req - Express request object
     */
    async logSuspiciousActivity(userId, activityType, activityDetails, req) {
        return this.logEvent({
            userId,
            action: 'SUSPICIOUS_ACTIVITY',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: false,
            details: {
                type: activityType,
                ...activityDetails
            }
        });
    }

    /**
     * Log account lockout
     * @param {Number} userId - User ID
     * @param {String} email - User email
     * @param {String} reason - Lockout reason
     * @param {Object} req - Express request object
     */
    async logAccountLockout(userId, email, reason, req) {
        return this.logEvent({
            userId,
            action: 'ACCOUNT_LOCKOUT',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: false,
            details: { email, reason }
        });
    }

    /**
     * Log account unlock (admin action)
     * @param {Number} adminId - Admin user ID who unlocked the account
     * @param {Number} targetUserId - User whose account was unlocked
     * @param {String} email - User email
     * @param {Object} req - Express request object
     */
    async logAccountUnlock(adminId, targetUserId, email, req) {
        return this.logEvent({
            userId: adminId,
            action: 'ACCOUNT_UNLOCK',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success: true,
            details: {
                adminId,
                targetUserId,
                email
            }
        });
    }

    /**
     * Log password reset request
     * @param {String} email - User email
     * @param {Boolean} success - Whether reset email was sent
     * @param {Object} req - Express request object
     */
    async logPasswordResetRequest(email, success, req) {
        return this.logEvent({
            userId: null,
            action: 'PASSWORD_RESET_REQUEST',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success,
            details: { email }
        });
    }

    /**
     * Log password reset completion
     * @param {Number} userId - User ID
     * @param {String} email - User email
     * @param {Boolean} success - Whether password reset was successful
     * @param {Object} req - Express request object
     */
    async logPasswordResetComplete(userId, email, success, req) {
        return this.logEvent({
            userId,
            action: success ? 'PASSWORD_RESET_SUCCESS' : 'PASSWORD_RESET_FAILED',
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            success,
            details: { email }
        });
    }

    /**
     * Get recent audit logs for a user
     * @param {Number} userId - User ID
     * @param {Number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} - Array of audit log records
     */
    async getUserAuditLogs(userId, limit = 50) {
        try {
            const query = `
                SELECT 
                    id,
                    user_id,
                    action,
                    ip_address,
                    user_agent,
                    success,
                    details,
                    created_at
                FROM auth_audit_logs
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            `;

            const [logs] = await db.execute(query, [userId, limit]);

            // Parse JSON details
            return logs.map(log => ({
                ...log,
                details: log.details ? JSON.parse(log.details) : null
            }));
        } catch (error) {
            console.error('Failed to fetch user audit logs:', error.message);
            return [];
        }
    }

    /**
     * Get recent failed login attempts
     * @param {Number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} - Array of failed login attempts
     */
    async getRecentFailedLogins(limit = 100) {
        try {
            const query = `
                SELECT 
                    id,
                    action,
                    ip_address,
                    user_agent,
                    details,
                    created_at
                FROM auth_audit_logs
                WHERE action = 'LOGIN_FAILED'
                ORDER BY created_at DESC
                LIMIT ?
            `;

            const [logs] = await db.execute(query, [limit]);

            // Parse JSON details
            return logs.map(log => ({
                ...log,
                details: log.details ? JSON.parse(log.details) : null
            }));
        } catch (error) {
            console.error('Failed to fetch failed logins:', error.message);
            return [];
        }
    }

    /**
     * Get suspicious activities
     * @param {Number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} - Array of suspicious activity logs
     */
    async getSuspiciousActivities(limit = 100) {
        try {
            const query = `
                SELECT 
                    id,
                    user_id,
                    action,
                    ip_address,
                    user_agent,
                    details,
                    created_at
                FROM auth_audit_logs
                WHERE action IN ('SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKOUT')
                ORDER BY created_at DESC
                LIMIT ?
            `;

            const [logs] = await db.execute(query, [limit]);

            // Parse JSON details
            return logs.map(log => ({
                ...log,
                details: log.details ? JSON.parse(log.details) : null
            }));
        } catch (error) {
            console.error('Failed to fetch suspicious activities:', error.message);
            return [];
        }
    }

    /**
     * Get audit logs by IP address
     * @param {String} ipAddress - IP address to search
     * @param {Number} limit - Maximum number of logs to return
     * @returns {Promise<Array>} - Array of audit logs from that IP
     */
    async getLogsByIP(ipAddress, limit = 50) {
        try {
            const query = `
                SELECT 
                    id,
                    user_id,
                    action,
                    ip_address,
                    user_agent,
                    success,
                    details,
                    created_at
                FROM auth_audit_logs
                WHERE ip_address = ?
                ORDER BY created_at DESC
                LIMIT ?
            `;

            const [logs] = await db.execute(query, [ipAddress, limit]);

            // Parse JSON details
            return logs.map(log => ({
                ...log,
                details: log.details ? JSON.parse(log.details) : null
            }));
        } catch (error) {
            console.error('Failed to fetch logs by IP:', error.message);
            return [];
        }
    }

    /**
     * Extract client IP address from request
     * Handles proxies and load balancers
     * @param {Object} req - Express request object
     * @returns {String} - Client IP address
     */
    getClientIP(req) {
        // Check for IP in various headers (proxy support)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            // x-forwarded-for may contain multiple IPs, take the first one
            return forwarded.split(',')[0].trim();
        }

        return req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               'unknown';
    }

    /**
     * Clean up old audit logs (for maintenance)
     * @param {Number} daysToKeep - Number of days of logs to retain
     * @returns {Promise<Number>} - Number of deleted records
     */
    async cleanupOldLogs(daysToKeep = 90) {
        try {
            const query = `
                DELETE FROM auth_audit_logs
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            `;

            const [result] = await db.execute(query, [daysToKeep]);

            console.log(`Cleaned up ${result.affectedRows} old audit log records`);
            return result.affectedRows;
        } catch (error) {
            console.error('Failed to clean up old audit logs:', error.message);
            return 0;
        }
    }

    /**
     * Get audit log statistics
     * @param {Number} days - Number of days to analyze
     * @returns {Promise<Object>} - Statistics object
     */
    async getStatistics(days = 30) {
        try {
            const query = `
                SELECT 
                    action,
                    success,
                    COUNT(*) as count
                FROM auth_audit_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY action, success
                ORDER BY count DESC
            `;

            const [stats] = await db.execute(query, [days]);

            return {
                period: `${days} days`,
                stats
            };
        } catch (error) {
            console.error('Failed to get audit statistics:', error.message);
            return null;
        }
    }
}

// Export singleton instance
module.exports = new AuditService();
