const validators = require('../utils/validators');
const passwordService = require('../services/passwordService');
const { executeQuery, queryFirst, transaction } = require('../config/database');

/**
 * User Management Controller
 * Handles user profile management operations and admin user management functions
 * Implements Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * Features:
 * - User profile retrieval and updates
 * - Password change with old password verification
 * - Admin-only user management and role updates
 * - Profile validation with uniqueness checks
 */

class UserController {
    /**
     * Get User Profile - Returns authenticated user's profile information
     * GET /api/users/profile
     * 
     * @param {Object} req - Express request object (contains authenticated user)
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 9.1: WHEN người dùng đã đăng nhập truy cập profile, 
     *   THE Authentication_System SHALL hiển thị thông tin cá nhân (trừ mật khẩu)
     */
    async getProfile(req, res) {
        try {
            const user = req.user; // Set by authMiddleware

            // Get complete user profile information from database
            const userProfile = await queryFirst(
                `SELECT user_id, full_name, email, phone, date_of_birth, role, 
                        created_at, last_login, email_verified, updated_at 
                 FROM users WHERE user_id = ?`,
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

            // Return profile data (excluding password and sensitive fields)
            res.json({
                success: true,
                user: {
                    id: userProfile.user_id,
                    fullName: userProfile.full_name,
                    email: userProfile.email,
                    phone: userProfile.phone,
                    dateOfBirth: userProfile.date_of_birth,
                    role: userProfile.role,
                    emailVerified: userProfile.email_verified,
                    createdAt: userProfile.created_at,
                    lastLogin: userProfile.last_login,
                    updatedAt: userProfile.updated_at
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

    /**
     * Update User Profile - Updates authenticated user's profile information
     * PUT /api/users/profile
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 9.2: WHEN người dùng cập nhật thông tin cá nhân, 
     *   THE Authentication_System SHALL validate dữ liệu trước khi lưu
     * - 9.3: WHEN người dùng cập nhật email, 
     *   THE Email_Validator SHALL kiểm tra email mới chưa được sử dụng
     * - 9.4: WHEN người dùng cập nhật số điện thoại, 
     *   THE Authentication_System SHALL kiểm tra số điện thoại mới chưa được sử dụng
     * - 9.5: THE Authentication_System SHALL không cho phép người dùng thay đổi role của chính họ
     */
    async updateProfile(req, res) {
        try {
            const user = req.user; // Set by authMiddleware
            const { fullName, email, phone, dateOfBirth } = req.body;

            // Validate that user is not trying to change their role
            if (req.body.hasOwnProperty('role')) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ROLE_CHANGE_FORBIDDEN',
                        message: 'Không thể thay đổi vai trò của chính bạn'
                    }
                });
            }

            // Build update data object with only provided fields
            const updateData = {};
            const validationErrors = {};

            // Validate and sanitize full name if provided
            if (fullName !== undefined) {
                const nameValidation = validators.validateAndSanitizeName(fullName);
                if (!nameValidation.isValid) {
                    validationErrors.fullName = nameValidation.error;
                } else {
                    updateData.full_name = nameValidation.sanitized;
                }
            }

            // Validate email if provided
            if (email !== undefined) {
                const emailValidation = validators.validateEmail(email);
                if (!emailValidation.isValid) {
                    validationErrors.email = emailValidation.error;
                } else {
                    const normalizedEmail = email.trim().toLowerCase();
                    
                    // Check if email is different from current email
                    if (normalizedEmail !== user.email.toLowerCase()) {
                        // Check email uniqueness
                        const existingUser = await queryFirst(
                            'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
                            [normalizedEmail, user.userId]
                        );

                        if (existingUser) {
                            validationErrors.email = 'Email đã được sử dụng bởi tài khoản khác';
                        } else {
                            updateData.email = normalizedEmail;
                            // Reset email verification when email changes
                            updateData.email_verified = false;
                        }
                    }
                }
            }

            // Validate phone if provided
            if (phone !== undefined) {
                const phoneValidation = validators.validateVietnamesePhone(phone);
                if (!phoneValidation.isValid) {
                    validationErrors.phone = phoneValidation.error;
                } else {
                    // Check phone uniqueness
                    const existingUser = await queryFirst(
                        'SELECT user_id FROM users WHERE phone = ? AND user_id != ?',
                        [phoneValidation.formatted, user.userId]
                    );

                    if (existingUser) {
                        validationErrors.phone = 'Số điện thoại đã được sử dụng bởi tài khoản khác';
                    } else {
                        updateData.phone = phoneValidation.formatted;
                    }
                }
            }

            // Validate date of birth if provided
            if (dateOfBirth !== undefined) {
                if (dateOfBirth === null || dateOfBirth === '') {
                    updateData.date_of_birth = null;
                } else {
                    const dobValidation = validators.validateDateOfBirth(dateOfBirth);
                    if (!dobValidation.isValid) {
                        validationErrors.dateOfBirth = dobValidation.error;
                    } else {
                        updateData.date_of_birth = dateOfBirth;
                    }
                }
            }

            // Return validation errors if any
            if (Object.keys(validationErrors).length > 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Dữ liệu không hợp lệ',
                        details: validationErrors
                    }
                });
            }

            // Check if there are any fields to update
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'NO_UPDATES',
                        message: 'Không có thông tin nào để cập nhật'
                    }
                });
            }

            // Add updated_at timestamp
            updateData.updated_at = new Date();

            // Build dynamic update query
            const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(updateData), user.userId];

            const updateQuery = `UPDATE users SET ${setClause} WHERE user_id = ?`;

            // Execute update using transaction for data integrity
            await transaction(async (connection) => {
                await connection.execute(updateQuery, values);
            });

            // Get updated user profile
            const updatedProfile = await queryFirst(
                `SELECT user_id, full_name, email, phone, date_of_birth, role, 
                        created_at, last_login, email_verified, updated_at 
                 FROM users WHERE user_id = ?`,
                [user.userId]
            );

            // Return success response with updated profile
            res.json({
                success: true,
                message: 'Cập nhật thông tin cá nhân thành công',
                user: {
                    id: updatedProfile.user_id,
                    fullName: updatedProfile.full_name,
                    email: updatedProfile.email,
                    phone: updatedProfile.phone,
                    dateOfBirth: updatedProfile.date_of_birth,
                    role: updatedProfile.role,
                    emailVerified: updatedProfile.email_verified,
                    createdAt: updatedProfile.created_at,
                    lastLogin: updatedProfile.last_login,
                    updatedAt: updatedProfile.updated_at
                }
            });

            // Log profile update for audit
            console.log(`Profile updated for user: ${user.email} (ID: ${user.userId}) - Fields: ${Object.keys(updateData).join(', ')}`);

        } catch (error) {
            console.error('Update profile error:', error);
            
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
                    message: 'Lỗi server khi cập nhật thông tin'
                }
            });
        }
    }

    /**
     * Change Password - Updates user password with old password verification
     * PUT /api/users/change-password
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 5.5: THE Authentication_System SHALL cung cấp chức năng đổi mật khẩu yêu cầu xác nhận mật khẩu cũ
     * - 5.3: WHEN người dùng đổi mật khẩu, THE Password_Hasher SHALL hash mật khẩu mới trước khi lưu
     */
    async changePassword(req, res) {
        try {
            const user = req.user; // Set by authMiddleware
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Validate required fields
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu là bắt buộc'
                    }
                });
            }

            // Check that new password and confirmation match
            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PASSWORD_MISMATCH',
                        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
                    }
                });
            }

            // Check that new password is different from current password
            if (currentPassword === newPassword) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'SAME_PASSWORD',
                        message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
                    }
                });
            }

            // Get current user data including password hash
            const userData = await queryFirst(
                'SELECT user_id, email, password FROM users WHERE user_id = ?',
                [user.userId]
            );

            if (!userData) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'Không tìm thấy thông tin người dùng'
                    }
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await passwordService.comparePassword(
                currentPassword, 
                userData.password
            );

            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CURRENT_PASSWORD',
                        message: 'Mật khẩu hiện tại không đúng'
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

            // Hash the new password
            const hashedNewPassword = await passwordService.hashPassword(newPassword);

            // Update password in database using transaction
            await transaction(async (connection) => {
                await connection.execute(
                    'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
                    [hashedNewPassword, user.userId]
                );
            });

            // Log password change for audit (without sensitive data)
            console.log(`Password changed for user: ${userData.email} (ID: ${user.userId}) at ${new Date().toISOString()}`);

            res.json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });

        } catch (error) {
            console.error('Change password error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi đổi mật khẩu'
                }
            });
        }
    }

    /**
     * Get User Management (Admin Only) - Returns paginated list of all users
     * GET /api/users/manage
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 9.6: Admin functionality for user management
     * - Admin-only access control for user management operations
     */
    async getUserManagement(req, res) {
        try {
            const user = req.user; // Set by authMiddleware

            // Verify admin role
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Chỉ admin mới có quyền truy cập chức năng này'
                    }
                });
            }

            // Simple query without complex filtering for now
            const usersQuery = `
                SELECT id, fullname, email, phone, date_of_birth, role, 
                       created_at, updated_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 100
            `;

            const users = await executeQuery(usersQuery, []);

            // Format user data
            const formattedUsers = users.map(userRecord => ({
                id: userRecord.id,
                fullName: userRecord.fullname,
                email: userRecord.email,
                phone: userRecord.phone,
                dateOfBirth: userRecord.date_of_birth,
                role: userRecord.role,
                createdAt: userRecord.created_at,
                updatedAt: userRecord.updated_at
            }));

            res.json({
                success: true,
                data: {
                    users: formattedUsers
                }
            });

        } catch (error) {
            console.error('Get user management error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi lấy danh sách người dùng',
                    details: error.message
                }
            });
        }
    }

    /**
     * Update User Role (Admin Only) - Updates another user's role
     * PUT /api/users/:id/role
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * 
     * Validates Requirements:
     * - 9.6: WHEN admin cập nhật thông tin người dùng khác, 
     *   THE Role_Manager SHALL cho phép thay đổi role
     */
    async updateUserRole(req, res) {
        try {
            const adminUser = req.user; // Set by authMiddleware
            const targetUserId = parseInt(req.params.id);
            const { role } = req.body;

            // Verify admin role (should be handled by middleware but double-check)
            if (adminUser.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Chỉ admin mới có quyền thay đổi vai trò người dùng'
                    }
                });
            }

            // Validate target user ID
            if (!targetUserId || isNaN(targetUserId)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_USER_ID',
                        message: 'ID người dùng không hợp lệ'
                    }
                });
            }

            // Validate new role
            const roleValidation = validators.validateUserRole(role);
            if (!roleValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ROLE',
                        message: roleValidation.error
                    }
                });
            }

            const newRole = role.toLowerCase();

            // Prevent admin from changing their own role
            if (targetUserId === adminUser.userId) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'SELF_ROLE_CHANGE_FORBIDDEN',
                        message: 'Không thể thay đổi vai trò của chính bạn'
                    }
                });
            }

            // Get target user information
            const targetUser = await queryFirst(
                'SELECT user_id, full_name, email, role FROM users WHERE user_id = ?',
                [targetUserId]
            );

            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'Không tìm thấy người dùng cần cập nhật'
                    }
                });
            }

            // Check if role is actually changing
            if (targetUser.role === newRole) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'NO_ROLE_CHANGE',
                        message: 'Vai trò mới trùng với vai trò hiện tại'
                    }
                });
            }

            // Update user role using transaction
            await transaction(async (connection) => {
                await connection.execute(
                    'UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?',
                    [newRole, targetUserId]
                );
            });

            // Get updated user data
            const updatedUser = await queryFirst(
                'SELECT user_id, full_name, email, role, updated_at FROM users WHERE user_id = ?',
                [targetUserId]
            );

            // Log role change for audit
            console.log(`Role changed by admin ${adminUser.email} (ID: ${adminUser.userId}): User ${targetUser.email} (ID: ${targetUserId}) from '${targetUser.role}' to '${newRole}' at ${new Date().toISOString()}`);

            res.json({
                success: true,
                message: `Cập nhật vai trò thành công: ${targetUser.full_name} từ '${targetUser.role}' thành '${newRole}'`,
                user: {
                    id: updatedUser.user_id,
                    fullName: updatedUser.full_name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    updatedAt: updatedUser.updated_at
                }
            });

        } catch (error) {
            console.error('Update user role error:', error);
            
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Lỗi server khi cập nhật vai trò người dùng'
                }
            });
        }
    }
}

module.exports = new UserController();