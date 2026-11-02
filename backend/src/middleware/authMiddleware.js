const jwtService = require('../services/jwtService');

/**
 * JWT Authentication Middleware
 * Provides authentication and authorization middleware for Express routes
 * Validates JWT tokens and enforces role-based access control
 */

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {String|null} - JWT token or null if not found
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.get('Authorization');
  return jwtService.extractTokenFromHeader(authHeader);
};

/**
 * Set user context in request object after successful authentication
 * @param {Object} req - Express request object
 * @param {Object} decoded - Decoded JWT payload
 */
const setUserContext = (req, decoded) => {
  req.user = {
    id: decoded.userId,
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    fullName: decoded.fullName,
    jti: decoded.jti
  };
};

/**
 * Create standardized error response for authentication failures
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} code - Error code
 * @param {String} message - Error message
 */
const sendAuthError = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Verify JWT Token Middleware
 * Validates JWT token from Authorization header and sets user context
 * Returns 401 for missing, invalid, or expired tokens
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return sendAuthError(res, 401, 'TOKEN_MISSING', 'Token not provided');
    }

    // Verify token signature and expiration
    const decoded = jwtService.verifyToken(token);
    
    // Set user context in request object
    setUserContext(req, decoded);
    
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.message === 'TOKEN_EXPIRED') {
      return sendAuthError(res, 401, 'TOKEN_EXPIRED', 'Token has expired');
    }
    
    if (error.message === 'TOKEN_INVALID') {
      return sendAuthError(res, 401, 'TOKEN_INVALID', 'Invalid token');
    }
    
    if (error.message === 'TOKEN_NOT_ACTIVE') {
      return sendAuthError(res, 401, 'TOKEN_NOT_ACTIVE', 'Token not yet valid');
    }
    
    // Generic token error
    return sendAuthError(res, 401, 'TOKEN_ERROR', 'Token verification failed');
  }
};

/**
 * Require Role Middleware Factory
 * Creates middleware that checks if authenticated user has required role(s)
 * Must be used after verifyToken middleware
 * 
 * @param {String|Array} requiredRoles - Single role string or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (requiredRoles) => {
  // Normalize to array
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return (req, res, next) => {
    // Ensure user context is set (verifyToken should run first)
    if (!req.user) {
      return sendAuthError(res, 401, 'TOKEN_MISSING', 'Authentication required');
    }
    
    // Check if user role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return sendAuthError(res, 403, 'INSUFFICIENT_PERMISSIONS', 
        `Access denied. Required roles: ${roles.join(', ')}`);
    }
    
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attempts to authenticate user but continues even if token is missing/invalid
 * Sets user context if valid token is provided, otherwise req.user remains undefined
 * Used for mixed public/private endpoints that show different content based on auth status
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);
    
    // If no token provided, continue without user context
    if (!token) {
      return next();
    }
    
    // Verify token - if valid, set user context
    const decoded = jwtService.verifyToken(token);
    setUserContext(req, decoded);
    
    next();
  } catch (error) {
    // For optional auth, we don't return errors
    // Just continue without setting user context
    // This allows public access while providing enhanced features for authenticated users
    next();
  }
};

/**
 * Admin Only Middleware
 * Convenience middleware that requires admin role
 * Combines authentication and admin role checking
 */
const adminOnly = [verifyToken, requireRole('admin')];

/**
 * Patient Only Middleware 
 * Convenience middleware that requires patient role
 */
const patientOnly = [verifyToken, requireRole('patient')];

/**
 * Doctor Only Middleware
 * Convenience middleware that requires doctor role
 */
const doctorOnly = [verifyToken, requireRole('doctor')];

/**
 * Receptionist Only Middleware
 * Convenience middleware that requires receptionist role
 */
const receptionistOnly = [verifyToken, requireRole('receptionist')];

/**
 * Staff Middleware
 * Allows access to doctor, receptionist, or admin roles
 */
const staffOnly = [verifyToken, requireRole(['doctor', 'receptionist', 'admin'])];

/**
 * Medical Staff Middleware
 * Allows access to doctor or admin roles (for medical operations)
 */
const medicalStaffOnly = [verifyToken, requireRole(['doctor', 'admin'])];

module.exports = {
  // Core middleware functions
  verifyToken,
  requireRole,
  optionalAuth,
  
  // Convenience middleware combinations
  adminOnly,
  patientOnly,
  doctorOnly,
  receptionistOnly,
  staffOnly,
  medicalStaffOnly,
  
  // Utility functions (exported for testing)
  extractTokenFromHeader,
  setUserContext,
  sendAuthError
};