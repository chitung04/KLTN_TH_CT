const { executeQuery } = require('../config/database');

/**
 * Audit Logging Service
 * Handles security event logging for all authentication actions
 * 
 * Requirements: 10.1, 10.3, 10.4, 10.5
 * Logs login attempts (successful and failed) with IP and timestamp
 * Tracks password changes and profile updates
 * Monitors admin role changes and suspicious activities
 */
class AuditLogService {
    /**
     * Log an authentication event to the audit log
     * @param {Object} logData - Log entry data
     * @param {Number|null} logData.userId - User ID (null for failed login attempts)
     * @param {String} logData.action - Action performed (e.g., 'login', 'logout', 'register', 'password_change')
     * @param {String} logData.ipAddress - IP address of the request
     * @param {String} logData.userAgent - User agent string from request headers
     * @param {Boolean} logData.success - Whether the action was successful
     * @param {String|null} logData.failureReason - Reason for failure (if applicable)
     * @returns {Promise<Object>} Result of the log operation
     */
    async logEvent(logData) {
        try {
            const {
                userId = null,
                action,
                ipAddress,
                userAgent = null,
                success,
                failureReason = null
            } = logData;

            // Validate required fields
            if (!action || !ipAddress || success === undefined) {
                throw new Error('Missing required fields for audit log');
            }

            const query = `
                INSERT INTO auth_audit_logs 
                (user_id, action, ip_address, user_agent, success, failure_reason, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;

            const params = [
                userId,
                action,
                ipAddress,
                userAgent,
                success ? 1 : 0,
                failureReason
            ];

            const result = await executeQuery(query, params);

            return {
                success: true,
                logId: result.insertId
            };
        } catch (error) {
            // Log to console but don't throw - audit logging should not break the main flow
            console.error('Audit log error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Log a successful login attempt
     * @param {Number} userId - User ID
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @returns {Promise<Object>}
     */
    async logLogin(userId, ipAddress, userAgent) {
        return this.logEvent({
            userId,
            action: 'login',
            ipAddress,
            userAgent,
            success: true
        });
    }

    /**
     * Log a failed login attempt
     * @param {String} email - Email attempted (not user ID since login failed)
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @param {String} failureReason - Reason for failure
     * @returns {Promise<Object>}
     */
    async logFailedLogin(email, ipAddress, userAgent, failureReason) {
        return this.logEvent({
            userId: null, // No user ID for failed login
            action: 'login_failed',
            ipAddress,
            userAgent,
            success: false,
            failureReason: `${failureReason} (email: ${email})`
        });
    }

    /**
     * Log a successful logout
     * @param {Number} userId - User ID
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @returns {Promise<Object>}
     */
    async logLogout(userId, ipAddress, userAgent) {
        return this.logEvent({
            userId,
            action: 'logout',
            ipAddress,
            userAgent,
            success: true
        });
    }

    /**
     * Log a successful user registration
     * @param {Number} userId - User ID
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @returns {Promise<Object>}
     */
    async logRegistration(userId, ipAddress, userAgent) {
        return this.logEvent({
            userId,
            action: 'register',
            ipAddress,
            userAgent,
            success: true
        });
    }

    /**
     * Log a failed registration attempt
     * @param {String} email - Email attempted
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @param {String} failureReason - Reason for failure
     * @returns {Promise<Object>}
     */
    async logFailedRegistration(email, ipAddress, userAgent, failureReason) {
        return this.logEvent({
            userId: null,
            action: 'register_failed',
            ipAddress,
            userAgent,
            success: false,
            failureReason: `${failureReason} (email: ${email})`
        });
    }

    /**
     * Log a password change event
     * @param {Number} userId - User ID
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @param {Boolean} success - Whether the password change was successful
     * @param {String|null} failureReason - Reason for failure (if applicable)
     * @returns {Promise<Object>}
     */
    async logPasswordChange(userId, ipAddress, userAgent, success = true, failureReason = null) {
        return this.logEvent({
            userId,
            action: 'password_change',
            ipAddress,
            userAgent,
            success,
            failureReason
        });
    }

    /**
     * Log a password reset request
     * @param {Number} userId - User ID
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @returns {Promise<Object>}
     */
    async logPasswordResetRequest(userId, ipAddress, userAgent) {
        return this.logEvent({
            userId,
            action: 'password_reset_request',
            ipAddress,
            userAgent,
            success: true
        });
    }

    /**
     * Log a password reset completion
     * @param {Number} userId - User ID
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @returns {Promise<Object>}
     */
    async logPasswordReset(userId, ipAddress, userAgent) {
        return this.logEvent({
            userId,
            action: 'password_reset',
            ipAddress,
            userAgent,
            success: true
        });
    }

    /**
     * Log a profile update event
     * @param {Number} userId - User ID
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @param {String|null} changes - Description of changes made
     * @returns {Promise<Object>}
     */
    async logProfileUpdate(userId, ipAddress, userAgent, changes = null) {
        return this.logEvent({
            userId,
            action: 'profile_update',
            ipAddress,
            userAgent,
            success: true,
            failureReason: changes ? `Changes: ${changes}` : null
        });
    }

    /**
     * Log an admin role change event
     * @param {Number} adminUserId - ID of admin performing the action
     * @param {Number} targetUserId - ID of user whose role is being changed
     * @param {String} oldRole - Previous role
     * @param {String} newRole - New role
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @returns {Promise<Object>}
     */
    async logRoleChange(adminUserId, targetUserId, oldRole, newRole, ipAddress, userAgent) {
        return this.logEvent({
            userId: adminUserId,
            action: 'role_change',
            ipAddress,
            userAgent,
            success: true,
            failureReason: `Changed user ${targetUserId} role from ${oldRole} to ${newRole}`
        });
    }

    /**
     * Log a suspicious activity event
     * @param {Number|null} userId - User ID (if known)
     * @param {String} ipAddress - IP address
     * @param {String} userAgent - User agent
     * @param {String} suspiciousActivity - Description of suspicious activity
     * @returns {Promise<Object>}
     */
    async logSuspiciousActivity(userId, ipAddress, userAgent, suspiciousActivity) {
        return this.logEvent({
            userId,
            action: 'suspicious_activity',
            ipAddress,
            userAgent,
            success: false,
            failureReason: suspiciousActivity
        });
    }

    /**
     * Get audit logs with filtering and pagination
     * @param {Object} filters - Filter criteria
     * @param {Number|null} filters.userId - Filter by user ID
     * @param {String|null} filters.action - Filter by action type
     * @param {Date|null} filters.startDate - Filter by start date
     * @param {Date|null} filters.endDate - Filter by end date
     * @param {Number} filters.page - Page number (default: 1)
     * @param {Number} filters.limit - Items per page (default: 50)
     * @returns {Promise<Object>} Paginated audit logs
     */
    async getAuditLogs(filters = {}) {
        try {
            const {
                userId = null,
                action = null,
                startDate = null,
                endDate = null,
                page = 1,
                limit = 50
            } = filters;

            // Build WHERE clause dynamically
            const conditions = [];
            const params = [];

            if (userId) {
                conditions.push('user_id = ?');
                params.push(userId);
            }

            if (action) {
                conditions.push('action = ?');
                params.push(action);
            }

            if (startDate) {
                conditions.push('timestamp >= ?');
                params.push(startDate);
            }

            if (endDate) {
                conditions.push('timestamp <= ?');
                params.push(endDate);
            }

            const whereClause = conditions.length > 0 
                ? `WHERE ${conditions.join(' AND ')}` 
                : '';

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM auth_audit_logs
                ${whereClause}
            `;
            const [countResult] = await executeQuery(countQuery, params);
            const total = countResult.total;

            // Get paginated results
            const offset = (page - 1) * limit;
            const dataQuery = `
                SELECT 
                    log_id,
                    user_id,
                    action,
                    ip_address,
                    user_agent,
                    success,
                    failure_reason,
                    timestamp
                FROM auth_audit_logs
                ${whereClause}
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            `;
            
            const dataParams = [...params, limit, offset];
            const logs = await executeQuery(dataQuery, dataParams);

            return {
                success: true,
                data: logs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Get audit logs error:', error.message);
            throw error;
        }
    }

    /**
     * Get recent failed login attempts for an IP address
     * Used for rate limiting and suspicious activity detection
     * @param {String} ipAddress - IP address
     * @param {Number} minutesBack - How many minutes back to check (default: 15)
     * @returns {Promise<Number>} Count of failed attempts
     */
    async getRecentFailedLoginsByIP(ipAddress, minutesBack = 15) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM auth_audit_logs
                WHERE ip_address = ?
                AND action = 'login_failed'
                AND success = 0
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
            `;

            const [result] = await executeQuery(query, [ipAddress, minutesBack]);
            return result.count;
        } catch (error) {
            console.error('Get failed logins error:', error.message);
            return 0; // Return 0 on error to avoid blocking legitimate users
        }
    }

    /**
     * Get audit log statistics for dashboard
     * @param {Number} days - Number of days to look back (default: 7)
     * @returns {Promise<Object>} Statistics object
     */
    async getAuditStatistics(days = 7) {
        try {
            const query = `
                SELECT 
                    action,
                    success,
                    COUNT(*) as count,
                    DATE(timestamp) as date
                FROM auth_audit_logs
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY action, success, DATE(timestamp)
                ORDER BY date DESC, action
            `;

            const results = await executeQuery(query, [days]);

            return {
                success: true,
                data: results
            };
        } catch (error) {
            console.error('Get audit statistics error:', error.message);
            throw error;
        }
    }
}

module.exports = new AuditLogService();
