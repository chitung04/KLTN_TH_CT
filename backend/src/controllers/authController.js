const jwtService = require('../services/jwtService');
const passwordService = require('../services/passwordService');
const validators = require('../utils/validators');
const { executeQuery, queryFirst, transaction } = require('../config/database');
const crypto = require('crypto');
const auditLogService = require('../services/auditLogService');

/**
 * Authentication Controller
 * Handles all core authentication operations including user registration,
 * login, logout, and password recovery for the THCT Clinic system.
 * 
 * Implements Requirements: 1.1, 2.1, 2.2, 4.4, 6.6
 */

class AuthController {
    /**
     * User Registration - Creates new user account with validation
     * POST /api/auth/register
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 1.1: User registration with validation and user creation
     * - 1.2: Email uniqueness validation
     * - 1.3: Phone uniqueness validation  
     * - 1.4: Password hashing with bcrypt
     * - 1.7: Default 'patient' role for public registrations
     */
    async register(req, res) {
        try {
            const { fullName, email, phone, password, dateOfBirth, role } = req.body;

            // Validate and sanitize registration data
            const validation = validators.validateRegistrationData({
                fullName,
                email, 
                phone,
                password,
                dateOfBirth,
                role: role || 'patient' // Default to patient role
            });

            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid registration data',
                        details: validation.errors
                    }
                });
            }

            const sanitizedData = validation.sanitizedData;

            // Get IP address and user agent for audit logging
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            // Check email uniqueness
            const existingUserByEmail = await queryFirst(
                'SELECT id as user_id FROM users WHERE email = ?',
                [sanitizedData.email]
            );

            if (existingUserByEmail) {
                // Log failed registration attempt
                await auditLogService.logFailedRegistration(
                    sanitizedData.email,
                    ipAddress,
                    userAgent,
                    'Email already registered'
                );

                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'DUPLICATE_EMAIL',
                        message: 'Email đã được sử dụng',
                        details: { email: 'Email address is already registered' }
                    }
                });
            }

            // Check phone uniqueness
            const existingUserByPhone = await queryFirst(
                'SELECT id as user_id FROM users WHERE phone = ?',
                [sanitizedData.phone]
            );

            if (existingUserByPhone) {
                // Log failed registration attempt
                await auditLogService.logFailedRegistration(
                    sanitizedData.email,
                    ipAddress,
                    userAgent,
                    'Phone number already registered'
                );

                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'DUPLICATE_PHONE',
                        message: 'Số điện thoại đã được sử dụng',
                        details: { phone: 'Phone number is already registered' }
                    }
                });
            }

            // Hash password with bcrypt (minimum salt rounds 12)
            const hashedPassword = await passwordService.hashPassword(sanitizedData.password);

            // Create user account using transaction for data integrity
            const result = await transaction(async (connection) => {
                const [insertResult] = await connection.execute(
                    `INSERT INTO users (fullname, email, phone, password, role, created_at) 
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        sanitizedData.fullName,
                        sanitizedData.email,
                        sanitizedData.phone,
                        hashedPassword,
                        'patient' // Default role for registration
                    ]
                );

                return insertResult;
            });

            // Generate JWT token for immediate login
            const tokenPayload = {
                userId: result.insertId,
                email: sanitizedData.email,
                role: 'patient',
                fullName: sanitizedData.fullName
            };

            const token = jwtService.generateToken(tokenPayload);

            // Log successful registration
            await auditLogService.logRegistration(result.insertId, ipAddress, userAgent);

            // Return success response with user data and token
            res.status(201).json({
                success: true,
                message: 'Đăng ký tài khoản thành công',
                user: {
                    id: result.insertId,
                    fullName: sanitizedData.fullName,
                    email: sanitizedData.email,
                    phone: sanitizedData.phone,
                    role: sanitizedData.role,
                    dateOfBirth: sanitizedData.dateOfBirth
                },
                token
            });

        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'DUPLICATE_DATA',
                        message: 'Email hoặc số điện thoại đã được sử dụng'
                    }
                });
            }

            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi đăng ký tài khoản'
                }
            });
        }
    }

    /**
     * User Login - Authenticates user and generates JWT token
     * POST /api/auth/login
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 2.1: Credential verification and JWT token generation
     * - 2.2: Invalid credentials error handling
     * - 2.3: JWT token with user_id, role, and expiration
     * - 2.4: 24-hour token lifespan
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Get IP address and user agent for audit logging
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            // Validate login credentials
            const validation = validators.validateLoginCredentials({ email, password });
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid login credentials',
                        details: validation.errors
                    }
                });
            }

            // Find user by email
            const user = await queryFirst(
                'SELECT id as user_id, fullname as full_name, email, phone, password, role, login_attempts, locked_until FROM users WHERE email = ?',
                [email.trim().toLowerCase()]
            );

            // Check if user exists (use generic message for security)
            if (!user) {
                // Log failed login attempt
                await auditLogService.logFailedLogin(
                    email.trim().toLowerCase(),
                    ipAddress,
                    userAgent,
                    'User not found'
                );

                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Email hoặc mật khẩu không đúng'
                    }
                });
            }

            // Check if account is locked
            if (user.locked_until && new Date() < new Date(user.locked_until)) {
                return res.status(423).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_LOCKED',
                        message: 'Tài khoản đã bị khóa do nhiều lần đăng nhập sai. Vui lòng thử lại sau.'
                    }
                });
            }

            // Verify password
            const isPasswordValid = await passwordService.comparePassword(password, user.password);
            
            if (!isPasswordValid) {
                // Increment login attempts
                const newAttempts = (user.login_attempts || 0) + 1;
                const shouldLock = newAttempts >= 5;
                
                // Lock account if too many failed attempts (5 attempts)
                if (shouldLock) {
                    const lockUntil = new Date();
                    lockUntil.setMinutes(lockUntil.getMinutes() + 15); // Lock for 15 minutes

                    await executeQuery(
                        'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
                        [newAttempts, lockUntil, user.user_id]
                    );

                    return res.status(423).json({
                        success: false,
                        error: {
                            code: 'ACCOUNT_LOCKED',
                            message: 'Tài khoản đã bị khóa do quá nhiều lần đăng nhập sai'
                        }
                    });
                } else {
                    // Just increment attempts
                    await executeQuery(
                        'UPDATE users SET login_attempts = ? WHERE id = ?',
                        [newAttempts, user.user_id]
                    );
                }

                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Email hoặc mật khẩu không đúng'
                    }
                });
            }

            // Reset login attempts on successful login and update last_login
            await executeQuery(
                'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
                [user.user_id]
            );

            // Generate JWT token
            const tokenPayload = {
                userId: user.user_id,
                email: user.email,
                role: user.role,
                fullName: user.full_name
            };

            const token = jwtService.generateToken(tokenPayload);

            // Return successful login response
            res.json({
                success: true,
                message: 'Đăng nhập thành công',
                user: {
                    id: user.user_id,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                },
                token
            });

        } catch (error) {
            console.error('Login error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi đăng nhập'
                }
            });
        }
    }

    /**
     * User Logout - Invalidates JWT token (client-side implementation)
     * POST /api/auth/logout
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 4.4: Token invalidation for logout
     */
    async logout(req, res) {
        try {
            // For stateless JWT, logout is primarily handled client-side
            // Server can optionally maintain a blacklist of invalidated tokens
            // For now, we'll return success and let client handle token removal
            
            const user = req.user; // Set by authMiddleware

            // Log logout event for audit purposes
            console.log(`User logout: ${user.email} (ID: ${user.userId}) at ${new Date().toISOString()}`);

            // Optional: Add token to blacklist table for enhanced security
            // This would require storing the JTI (JWT ID) in a blacklist table
            // For MVP implementation, client-side token removal is sufficient

            res.json({
                success: true,
                message: 'Đăng xuất thành công'
            });

        } catch (error) {
            console.error('Logout error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi đăng xuất'
                }
            });
        }
    }

    /**
     * Forgot Password - Initiates password reset process
     * POST /api/auth/forgot-password
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 6.6: Password recovery functionality
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            // Validate email format
            const emailValidation = validators.validateEmail(email);
            if (!emailValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_EMAIL',
                        message: 'Định dạng email không hợp lệ'
                    }
                });
            }

            // Find user by email
            const user = await queryFirst(
                'SELECT id as user_id, email, fullname as full_name FROM users WHERE email = ?',
                [email.trim().toLowerCase()]
            );

            // Always return success for security (don't reveal if email exists)
            // But only process if user actually exists
            if (user) {
                // Generate secure reset token
                const resetToken = crypto.randomBytes(32).toString('hex');
                const resetExpires = new Date();
                resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

                // Store reset token in database
                await executeQuery(
                    'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
                    [resetToken, resetExpires, user.user_id]
                );

                // TODO: Send password reset email
                // This would integrate with email service to send reset link
                console.log(`Password reset requested for: ${user.email}`);
                console.log(`Reset token: ${resetToken} (expires: ${resetExpires})`);
            }

            // Always return success message for security
            res.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu'
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi xử lý yêu cầu đặt lại mật khẩu'
                }
            });
        }
    }

    /**
     * Reset Password - Completes password reset with token
     * POST /api/auth/reset-password
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 6.6: Password reset completion
     * - 5.3: New password hashing
     */
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            // Validate inputs
            if (!token || typeof token !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Token đặt lại mật khẩu không hợp lệ'
                    }
                });
            }

            // Validate new password strength
            const passwordValidation = validators.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: 'Mật khẩu mới không đủ mạnh',
                        details: passwordValidation.errors
                    }
                });
            }

            // Find user with valid reset token
            const user = await queryFirst(
                'SELECT id as user_id, email, fullname as full_name FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
                [token]
            );

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_OR_EXPIRED_TOKEN',
                        message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
                    }
                });
            }

            // Hash new password
            const hashedPassword = await passwordService.hashPassword(newPassword);

            // Update password and clear reset token
            await executeQuery(
                'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
                [hashedPassword, user.user_id]
            );

            // Log password change for audit
            console.log(`Password reset completed for user: ${user.email} (ID: ${user.user_id})`);

            res.json({
                success: true,
                message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi đặt lại mật khẩu'
                }
            });
        }
    }

    /**
     * Get Current User Profile - Returns authenticated user's information
     * GET /api/auth/profile
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getProfile(req, res) {
        try {
            const user = req.user; // Set by authMiddleware

            // Get complete user information from database
            const userProfile = await queryFirst(
                'SELECT id as user_id, fullname as full_name, email, phone, role, created_at, last_login FROM users WHERE id = ?',
                [user.userId]
            );

            if (!userProfile) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'Không tìm thấy thông tin người dùng'
                    }
                });
            }

            res.json({
                success: true,
                user: {
                    id: userProfile.user_id,
                    fullName: userProfile.full_name,
                    email: userProfile.email,
                    phone: userProfile.phone,
                    dateOfBirth: userProfile.date_of_birth,
                    role: userProfile.role,
                    createdAt: userProfile.created_at,
                    lastLogin: userProfile.last_login
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi lấy thông tin người dùng'
                }
            });
        }
    }
}

module.exports = new AuthController();