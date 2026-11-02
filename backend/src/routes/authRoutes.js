const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  authRateLimit, 
  registrationRateLimit, 
  passwordResetRateLimit,
  ipBlockingTracker 
} = require('../middleware/rateLimitMiddleware');

/**
 * Authentication Routes for THCT Clinic
 * Configures /api/auth routes with comprehensive middleware protection
 * 
 * Task 5.3: Set up authentication routes with middleware
 * - Rate limiting for brute force protection
 * - Input validation for security
 * - JWT token verification for protected endpoints
 * - Audit logging for security monitoring
 * 
 * Public Routes (no authentication required):
 * - POST /api/auth/register - User registration with rate limiting
 * - POST /api/auth/login - User login with rate limiting  
 * - POST /api/auth/forgot-password - Password recovery initiation
 * - POST /api/auth/reset-password - Password reset completion
 * 
 * Protected Routes (authentication required):
 * - POST /api/auth/logout - User logout
 * - GET /api/auth/profile - Get current user profile
 * 
 * Requirements validated: 8.1, 8.2, 8.3, 8.4
 */

// Middleware to track authentication attempts for security monitoring
const trackAuthAttempt = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Track failed login attempts for IP blocking
    if (req.route.path === '/login' && res.statusCode === 401) {
      const ip = req.ip || req.connection.remoteAddress;
      ipBlockingTracker.trackFailedAttempt(ip);
      
      // Log failed attempt for audit
      console.warn('Failed login attempt:', {
        ip,
        email: req.body.email,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
    
    // Clear failed attempts on successful login
    if (req.route.path === '/login' && res.statusCode === 200) {
      const ip = req.ip || req.connection.remoteAddress;
      ipBlockingTracker.clearFailedAttempts(ip);
      
      // Log successful login for audit
      console.info('Successful login:', {
        ip,
        email: req.body.email,
        timestamp: new Date().toISOString()
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Public Authentication Routes with Rate Limiting and Validation

/**
 * POST /api/auth/register
 * User registration endpoint with comprehensive validation
 * - Registration rate limiting (3 attempts per hour per IP)
 * - Input validation and sanitization
 * - Email and phone uniqueness checks
 * - Password strength validation
 * - Default 'patient' role assignment
 * 
 * Validates Requirements:
 * - 8.2: Allow access to public endpoints without token
 * - 1.1-1.7: User registration system requirements
 */
router.post('/register', 
    registrationRateLimit,
    authController.register
);

/**
 * POST /api/auth/login
 * User login endpoint with security protections
 * - Authentication rate limiting (5 attempts per 15 minutes per IP)
 * - Failed attempt tracking and IP blocking
 * - Credential validation and JWT generation
 * - Account lockout after repeated failures
 * 
 * Validates Requirements:
 * - 8.2: Allow access to public endpoints without token
 * - 8.3: Return 401 with "Token not provided" when no token (handled by controller)
 * - 8.4: Return 401 with "Invalid token" when invalid credentials
 * - 2.1, 2.2: User login system requirements
 */
router.post('/login', 
    authRateLimit,
    trackAuthAttempt,
    authController.login
);

/**
 * POST /api/auth/forgot-password
 * Password recovery initiation endpoint
 * - Password reset rate limiting (3 attempts per hour per IP)
 * - Email validation
 * - Security-conscious response (no user enumeration)
 * 
 * Validates Requirements:
 * - 8.2: Allow access to public endpoints without token
 * - 5.6: Password reset functionality
 */
router.post('/forgot-password', 
    passwordResetRateLimit,
    authController.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Password reset completion endpoint
 * - Token validation and expiration checking
 * - New password strength validation
 * - Secure password hashing
 * 
 * Validates Requirements:
 * - 8.2: Allow access to public endpoints without token
 * - 5.6: Password reset functionality
 * - 5.3: Password hashing requirements
 */
router.post('/reset-password', 
    passwordResetRateLimit,
    authController.resetPassword
);

// Protected Authentication Routes (Require Valid JWT Token)

/**
 * POST /api/auth/logout
 * User logout endpoint with token verification
 * - JWT token validation required
 * - Session invalidation (client-side)
 * - Audit logging for logout events
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when token invalid
 * - 4.4: Token invalidation for logout
 */
router.post('/logout', 
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    authController.logout
);

/**
 * GET /api/auth/profile
 * Get current authenticated user's profile
 * - JWT token validation required
 * - User context extraction from token
 * - Profile data retrieval (excluding sensitive fields)
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when token invalid
 * - 9.1: Display user profile information
 */
router.get('/profile', 
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    authController.getProfile
);

module.exports = router;