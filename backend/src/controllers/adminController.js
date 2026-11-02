const auditLogService = require('../services/auditLogService');
const { executeQuery, queryFirst } = require('../config/database');

/**
 * Admin Controller
 * Handles admin-specific operations including user management, 
 * security monitoring, department management, and doctor profile management
 * 
 * Requirements: 10.6 - Admin security dashboard, 16.1-16.7 - Department Management, 17.1-17.7 - Doctor Management
 */
class AdminController {
    // ============ DEPARTMENT MANAGEMENT ============
    
    /**
     * Get all departments with doctor counts
     * GET /api/admin/departments
     * Requirements: 16.6
     */
    async getDepartments(req, res) {
        try {
            const departments = await executeQuery(`
                SELECT 
                    d.id,
                    d.name,
                    d.description,
                    COUNT(doc.id) as doctor_count
                FROM departments d
                LEFT JOIN doctors doc ON d.id = doc.department_id
                GROUP BY d.id, d.name, d.description
                ORDER BY d.name
            `);

            res.json({
                success: true,
                data: departments
            });
        } catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy danh sách khoa'
                }
            });
        }
    }
    
    /**
     * Create a new department
     * POST /api/admin/departments
     * Body: { name, description }
     * Requirements: 16.1, 16.2
     */
    async createDepartment(req, res) {
        try {
            const { name, description } = req.body;
            
            // Validation: name is required (Requirement 16.2)
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Tên khoa không được để trống'
                    }
                });
            }
            
            // Insert department
            const result = await executeQuery(
                'INSERT INTO departments (name, description) VALUES (?, ?)',
                [name.trim(), description || null]
            );
            
            res.status(201).json({
                success: true,
                data: {
                    id: result.insertId,
                    name: name.trim(),
                    description: description || null
                },
                message: 'Tạo khoa thành công'
            });
            
        } catch (error) {
            console.error('Create department error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi tạo khoa'
                }
            });
        }
    }
    
    /**
     * Update a department
     * PUT /api/admin/departments/:id
     * Body: { name, description }
     * Requirements: 16.3
     */
    async updateDepartment(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            
            // Validation
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Tên khoa không được để trống'
                    }
                });
            }
            
            // Check if department exists
            const department = await queryFirst(
                'SELECT id FROM departments WHERE id = ?',
                [id]
            );
            
            if (!department) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'DEPARTMENT_NOT_FOUND',
                        message: 'Không tìm thấy khoa'
                    }
                });
            }
            
            // Update department
            await executeQuery(
                'UPDATE departments SET name = ?, description = ? WHERE id = ?',
                [name.trim(), description || null, id]
            );
            
            res.json({
                success: true,
                data: {
                    id: parseInt(id),
                    name: name.trim(),
                    description: description || null
                },
                message: 'Cập nhật khoa thành công'
            });
            
        } catch (error) {
            console.error('Update department error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi cập nhật khoa'
                }
            });
        }
    }
    
    /**
     * Delete a department
     * DELETE /api/admin/departments/:id
     * Requirements: 16.4, 16.5
     */
    async deleteDepartment(req, res) {
        try {
            const { id } = req.params;
            
            // Check if department exists
            const department = await queryFirst(
                'SELECT id, name FROM departments WHERE id = ?',
                [id]
            );
            
            if (!department) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'DEPARTMENT_NOT_FOUND',
                        message: 'Không tìm thấy khoa'
                    }
                });
            }
            
            // Check if department has associated doctors (Requirement 16.5)
            const [doctorsResult] = await executeQuery(
                'SELECT COUNT(*) as count FROM doctors WHERE department_id = ?',
                [id]
            );
            
            if (doctorsResult.count > 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'DEPARTMENT_HAS_DOCTORS',
                        message: `Không thể xóa khoa này vì còn ${doctorsResult.count} bác sĩ được gán vào khoa`
                    }
                });
            }
            
            // Delete department
            await executeQuery('DELETE FROM departments WHERE id = ?', [id]);
            
            res.json({
                success: true,
                message: `Xóa khoa "${department.name}" thành công`
            });
            
        } catch (error) {
            console.error('Delete department error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi xóa khoa'
                }
            });
        }
    }
    
    // ============ DOCTOR MANAGEMENT ============
    
    /**
     * Get all doctors with user and department information
     * GET /api/admin/doctors
     * Requirements: 17.6
     */
    async getDoctors(req, res) {
        try {
            const doctors = await executeQuery(`
                SELECT 
                    d.id as doctor_id,
                    d.user_id,
                    d.department_id,
                    d.degree,
                    u.fullname,
                    u.email,
                    u.phone,
                    u.role,
                    dept.name as department_name
                FROM doctors d
                JOIN users u ON d.user_id = u.id
                LEFT JOIN departments dept ON d.department_id = dept.id
                ORDER BY dept.name, u.fullname
            `);

            res.json({
                success: true,
                data: doctors
            });
        } catch (error) {
            console.error('Get doctors error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy danh sách bác sĩ'
                }
            });
        }
    }
    
    /**
     * Create a doctor profile
     * POST /api/admin/doctors
     * Body: { user_id, department_id, degree }
     * Requirements: 17.1, 17.2, 17.3, 17.4
     */
    async createDoctor(req, res) {
        try {
            const { user_id, department_id, degree } = req.body;
            
            // Validation
            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'user_id là bắt buộc'
                    }
                });
            }
            
            // Validate user exists and has doctor role (Requirement 17.4)
            const user = await queryFirst(
                'SELECT id, fullname, email, role FROM users WHERE id = ?',
                [user_id]
            );
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'Không tìm thấy người dùng'
                    }
                });
            }
            
            if (user.role !== 'doctor') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ROLE',
                        message: 'Người dùng phải có vai trò "doctor"'
                    }
                });
            }
            
            // Check if user already has a doctor profile
            const existingDoctor = await queryFirst(
                'SELECT id FROM doctors WHERE user_id = ?',
                [user_id]
            );
            
            if (existingDoctor) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'DOCTOR_ALREADY_EXISTS',
                        message: 'Người dùng này đã có hồ sơ bác sĩ'
                    }
                });
            }
            
            // Validate department exists if provided
            if (department_id) {
                const department = await queryFirst(
                    'SELECT id FROM departments WHERE id = ?',
                    [department_id]
                );
                
                if (!department) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'DEPARTMENT_NOT_FOUND',
                            message: 'Không tìm thấy khoa'
                        }
                    });
                }
            }
            
            // Insert doctor profile
            const result = await executeQuery(
                'INSERT INTO doctors (user_id, department_id, degree) VALUES (?, ?, ?)',
                [user_id, department_id || null, degree || null]
            );
            
            res.status(201).json({
                success: true,
                data: {
                    id: result.insertId,
                    user_id,
                    department_id: department_id || null,
                    degree: degree || null,
                    fullname: user.fullname,
                    email: user.email
                },
                message: 'Tạo hồ sơ bác sĩ thành công'
            });
            
        } catch (error) {
            console.error('Create doctor error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi tạo hồ sơ bác sĩ'
                }
            });
        }
    }
    
    /**
     * Update a doctor profile
     * PUT /api/admin/doctors/:id
     * Body: { department_id, degree }
     * Requirements: 17.5
     */
    async updateDoctor(req, res) {
        try {
            const { id } = req.params;
            const { department_id, degree } = req.body;
            
            // Check if doctor exists
            const doctor = await queryFirst(
                'SELECT id, user_id FROM doctors WHERE id = ?',
                [id]
            );
            
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'DOCTOR_NOT_FOUND',
                        message: 'Không tìm thấy bác sĩ'
                    }
                });
            }
            
            // Validate department exists if provided
            if (department_id) {
                const department = await queryFirst(
                    'SELECT id FROM departments WHERE id = ?',
                    [department_id]
                );
                
                if (!department) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'DEPARTMENT_NOT_FOUND',
                            message: 'Không tìm thấy khoa'
                        }
                    });
                }
            }
            
            // Update doctor profile
            await executeQuery(
                'UPDATE doctors SET department_id = ?, degree = ? WHERE id = ?',
                [department_id || null, degree || null, id]
            );
            
            // Get updated doctor info
            const updatedDoctor = await queryFirst(`
                SELECT 
                    d.id as doctor_id,
                    d.user_id,
                    d.department_id,
                    d.degree,
                    u.fullname,
                    u.email,
                    dept.name as department_name
                FROM doctors d
                JOIN users u ON d.user_id = u.id
                LEFT JOIN departments dept ON d.department_id = dept.id
                WHERE d.id = ?
            `, [id]);
            
            res.json({
                success: true,
                data: updatedDoctor,
                message: 'Cập nhật hồ sơ bác sĩ thành công'
            });
            
        } catch (error) {
            console.error('Update doctor error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi cập nhật hồ sơ bác sĩ'
                }
            });
        }
    }

    /**
     * Get audit logs with pagination and filtering
     * GET /api/admin/audit-logs
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAuditLogs(req, res) {
        try {
            const {
                userId,
                action,
                startDate,
                endDate,
                page = 1,
                limit = 50
            } = req.query;

            const filters = {
                userId: userId ? parseInt(userId) : null,
                action,
                startDate,
                endDate,
                page: parseInt(page),
                limit: parseInt(limit)
            };

            const result = await auditLogService.getAuditLogs(filters);

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy nhật ký kiểm toán'
                }
            });
        }
    }

    /**
     * Get security statistics for dashboard
     * GET /api/admin/security-statistics
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSecurityStatistics(req, res) {
        try {
            const { days = 1 } = req.query;

            // Get today's successful logins
            const [todayLoginsResult] = await executeQuery(`
                SELECT COUNT(*) as count
                FROM auth_audit_logs
                WHERE action = 'login'
                AND success = 1
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [parseInt(days)]);

            // Get failed login attempts
            const [failedAttemptsResult] = await executeQuery(`
                SELECT COUNT(*) as count
                FROM auth_audit_logs
                WHERE action = 'login_failed'
                AND success = 0
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [parseInt(days)]);

            // Get currently locked accounts
            const [lockedAccountsResult] = await executeQuery(`
                SELECT COUNT(*) as count
                FROM users
                WHERE locked_until IS NOT NULL
                AND locked_until > NOW()
            `);

            // Get suspicious activities
            const [suspiciousActivitiesResult] = await executeQuery(`
                SELECT COUNT(*) as count
                FROM auth_audit_logs
                WHERE action = 'suspicious_activity'
                AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [parseInt(days)]);

            res.json({
                success: true,
                statistics: {
                    todayLogins: todayLoginsResult.count || 0,
                    failedAttempts: failedAttemptsResult.count || 0,
                    lockedAccounts: lockedAccountsResult.count || 0,
                    suspiciousActivities: suspiciousActivitiesResult.count || 0
                }
            });
        } catch (error) {
            console.error('Get security statistics error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy thống kê bảo mật'
                }
            });
        }
    }

    /**
     * Get recent failed login attempts
     * GET /api/admin/failed-logins
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getFailedLogins(req, res) {
        try {
            const { limit = 100 } = req.query;

            const failedLogins = await executeQuery(`
                SELECT 
                    log_id,
                    action,
                    ip_address,
                    user_agent,
                    failure_reason,
                    timestamp
                FROM auth_audit_logs
                WHERE action = 'login_failed'
                AND success = 0
                ORDER BY timestamp DESC
                LIMIT ?
            `, [parseInt(limit)]);

            res.json({
                success: true,
                data: failedLogins
            });
        } catch (error) {
            console.error('Get failed logins error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy danh sách đăng nhập thất bại'
                }
            });
        }
    }

    /**
     * Get locked accounts
     * GET /api/admin/locked-accounts
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getLockedAccounts(req, res) {
        try {
            const lockedAccounts = await executeQuery(`
                SELECT 
                    id as user_id,
                    fullname as full_name,
                    email,
                    phone,
                    role,
                    login_attempts,
                    locked_until
                FROM users
                WHERE locked_until IS NOT NULL
                AND locked_until > NOW()
                ORDER BY locked_until DESC
            `);

            res.json({
                success: true,
                data: lockedAccounts
            });
        } catch (error) {
            console.error('Get locked accounts error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy danh sách tài khoản bị khóa'
                }
            });
        }
    }

    /**
     * Unlock a user account (admin action)
     * POST /api/admin/unlock-account/:userId
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async unlockAccount(req, res) {
        try {
            const { userId } = req.params;
            const adminUser = req.user; // Set by authMiddleware

            // Get user details
            const user = await queryFirst(
                'SELECT id as user_id, email, fullname as full_name, role FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'Không tìm thấy người dùng'
                    }
                });
            }

            // Unlock the account
            await executeQuery(
                'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
                [userId]
            );

            // Log the admin action
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            await auditLogService.logEvent({
                userId: adminUser.userId,
                action: 'account_unlock',
                ipAddress,
                userAgent,
                success: true,
                failureReason: `Admin ${adminUser.userId} unlocked account for user ${userId} (${user.email})`
            });

            res.json({
                success: true,
                message: `Đã mở khóa tài khoản ${user.email}`,
                user: {
                    id: user.user_id,
                    email: user.email,
                    fullName: user.full_name
                }
            });
        } catch (error) {
            console.error('Unlock account error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi mở khóa tài khoản'
                }
            });
        }
    }

    /**
     * Get audit statistics for charts
     * GET /api/admin/audit-statistics
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAuditStatistics(req, res) {
        try {
            const { days = 7 } = req.query;

            const result = await auditLogService.getAuditStatistics(parseInt(days));

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Get audit statistics error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy thống kê kiểm toán'
                }
            });
        }
    }

    /**
     * Get suspicious activities
     * GET /api/admin/suspicious-activities
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSuspiciousActivities(req, res) {
        try {
            const { limit = 100 } = req.query;

            const activities = await executeQuery(`
                SELECT 
                    log_id,
                    user_id,
                    action,
                    ip_address,
                    user_agent,
                    failure_reason,
                    timestamp
                FROM auth_audit_logs
                WHERE action IN ('suspicious_activity', 'account_lockout')
                ORDER BY timestamp DESC
                LIMIT ?
            `, [parseInt(limit)]);

            res.json({
                success: true,
                data: activities
            });
        } catch (error) {
            console.error('Get suspicious activities error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy hoạt động đáng ngờ'
                }
            });
        }
    }

    /**
     * Get logs by IP address
     * GET /api/admin/logs-by-ip/:ipAddress
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getLogsByIP(req, res) {
        try {
            const { ipAddress } = req.params;
            const { limit = 50 } = req.query;

            const logs = await executeQuery(`
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
                WHERE ip_address = ?
                ORDER BY timestamp DESC
                LIMIT ?
            `, [ipAddress, parseInt(limit)]);

            res.json({
                success: true,
                data: logs,
                ipAddress
            });
        } catch (error) {
            console.error('Get logs by IP error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi khi lấy nhật ký theo IP'
                }
            });
        }
    }
}

module.exports = new AdminController();
