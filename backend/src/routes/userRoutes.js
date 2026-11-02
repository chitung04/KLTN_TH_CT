const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole, adminOnly } = require('../middleware/authMiddleware');
const { globalRateLimit, authRateLimit } = require('../middleware/rateLimitMiddleware');

/**
 * User Management Routes with Authentication and Authorization
 * Configures user management endpoints with comprehensive middleware protection
 * 
 * Task 5.3: Configure admin-only routes with role checking
 * 
 * Protected User Routes (authentication required):
 * - GET /api/users/profile - Get authenticated user's profile
 * - PUT /api/users/profile - Update authenticated user's profile
 * - PUT /api/users/change-password - Change user password
 * 
 * Admin-Only Routes (admin role required):
 * - GET /api/users/manage - Get all users with filtering
 * - PUT /api/users/:id/role - Update user role
 * 
 * Middleware Stack:
 * - verifyToken: Validates JWT token and sets user context
 * - requireRole: Checks user role authorization
 * - Rate limiting: Prevents abuse and brute force attacks
 * 
 * Requirements validated: 8.1, 8.3, 8.4, 3.4, 3.6, 9.1-9.6
 */

// User Profile Management Routes (Authentication Required)

/**
 * GET /api/users/profile
 * Get authenticated user's profile information
 * - Requires valid JWT token
 * - Returns user profile excluding sensitive data
 * - Available to all authenticated users
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 * - 9.1: Display user profile information for authenticated users
 */
router.get('/profile', 
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    userController.getProfile
);

/**
 * PUT /api/users/profile
 * Update authenticated user's profile information
 * - Requires valid JWT token
 * - Validates data before saving
 * - Checks email/phone uniqueness
 * - Prevents role self-modification
 * - Rate limited to prevent abuse
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 * - 9.2: Validate data before saving
 * - 9.3: Check email uniqueness when updated
 * - 9.4: Check phone uniqueness when updated
 * - 9.5: Prevent users from changing their own role
 */
router.put('/profile',
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    globalRateLimit, // Prevent abuse of profile updates
    userController.updateProfile
);

/**
 * PUT /api/users/change-password
 * Change authenticated user's password
 * - Requires valid JWT token
 * - Requires current password verification
 * - Validates new password strength
 * - Hashes new password securely
 * - Strict rate limiting for security
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 * - 5.5: Require old password verification for password changes
 * - 5.3: Hash new password before storage
 */
router.put('/change-password',
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    authRateLimit, // Strict rate limit for password changes
    userController.changePassword
);

// Admin-Only User Management Routes (Role-Based Access Control)

/**
 * GET /api/users/manage
 * Get paginated list of all users with filtering and search
 * - Requires valid JWT token
 * - Requires admin role (403 Forbidden for non-admins)
 * - Supports pagination, search, and role filtering
 * - Excludes sensitive data like passwords
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 * - 3.4: Admin role access to all system functions
 * - 3.6: Return 403 Forbidden for unauthorized access attempts
 * - 9.6: Admin functionality for user management
 */
router.get('/manage',
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    requireRole('admin'), // Validates Requirements 3.4, 3.6
    userController.getUserManagement
);

/**
 * PUT /api/users/:id/role
 * Update another user's role (admin only)
 * - Requires valid JWT token
 * - Requires admin role (403 Forbidden for non-admins)
 * - Prevents admin from changing their own role
 * - Validates role values
 * - Logs role changes for audit
 * - Rate limited to prevent abuse
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 * - 3.4: Admin role access to all system functions
 * - 3.6: Return 403 Forbidden for unauthorized access attempts
 * - 9.6: Admin can change other users' roles
 */
router.put('/:id/role',
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    requireRole('admin'), // Validates Requirements 3.4, 3.6
    globalRateLimit, // Prevent abuse of role changes
    userController.updateUserRole
);

// Future Admin Routes (Commented for potential implementation)

/**
 * GET /api/users/:id
 * Get specific user details (admin only)
 * Future implementation for detailed user inspection
 */
// router.get('/:id',
//     verifyToken,
//     requireRole('admin'),
//     userController.getUserById
// );

/**
 * PUT /api/users/:id/status
 * Activate/deactivate user account (admin only)
 * Future implementation for user account status management
 */
// router.put('/:id/status',
//     verifyToken,
//     requireRole('admin'),
//     globalRateLimit,
//     userController.updateUserStatus
// );

/**
 * POST /api/users/:id/unlock
 * Unlock user account after failed login attempts (admin only)
 * Future implementation for manual account unlock
 */
// router.post('/:id/unlock',
//     verifyToken,
//     requireRole('admin'),
//     globalRateLimit,
//     userController.unlockUserAccount
// );

module.exports = router;