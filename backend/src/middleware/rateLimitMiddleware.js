const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware for THCT Clinic Authentication System
 * Provides comprehensive rate limiting protection against brute force attacks and API abuse
 * 
 * Features:
 * - Authentication endpoint protection (5 attempts per 15 minutes)
 * - Global API protection (1000 requests per 15 minutes)
 * - IP-based blocking for suspicious activity
 * - Custom error responses with security headers
 * - Skip successful requests for auth limiter
 */

/**
 * Safe IP key generator that handles IPv6 addresses properly
 * @param {Object} req - Express request object
 * @returns {String} - IP address key for rate limiting
 */
const createIPKeyGenerator = () => {
  return (req) => {
    // Use express-rate-limit's built-in IP handling to avoid IPv6 issues
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
  };
};

/**
 * Custom rate limit message generator
 * Creates consistent error responses for rate limiting
 * @param {Object} options - Rate limit configuration
 * @returns {Function} Message generator function
 */
const createRateLimitMessage = (options) => {
  return (req, res) => {
    const timeRemaining = Math.round(options.windowMs / 60000); // Convert to minutes
    
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many ${options.type || 'requests'} from this IP. Please try again in ${timeRemaining} minutes.`,
        retryAfter: timeRemaining,
        timestamp: new Date().toISOString(),
        type: options.type || 'general'
      }
    };
  };
};

/**
 * Custom rate limit handler
 * Logs rate limit violations and sends structured error responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @param {Object} options - Rate limit options
 */
const rateLimitHandler = (req, res, next, options) => {
  // Log rate limit violation for security monitoring
  console.warn('Rate limit exceeded:', {
    ip: req.ip || req.connection.remoteAddress,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    type: options.type || 'general'
  });

  // Set security headers
  res.set({
    'Retry-After': Math.round(options.windowMs / 1000), // Seconds
    'X-RateLimit-Limit': options.max,
    'X-RateLimit-Remaining': 0,
    'X-RateLimit-Reset': new Date(Date.now() + options.windowMs).toISOString()
  });

  // Send structured error response
  const message = createRateLimitMessage(options)(req, res);
  return res.status(429).json(message);
};

/**
 * Authentication Rate Limiter
 * Strict rate limiting for login/register endpoints to prevent brute force attacks
 * - 5 attempts per 15 minutes per IP
 * - Skips successful requests (doesn't count against limit)
 * - Applies to: /api/auth/login, /api/auth/register, /api/auth/forgot-password
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: createRateLimitMessage({
    windowMs: 15 * 60 * 1000,
    max: 5,
    type: 'authentication attempts'
  }),
  
  // Don't count successful requests against the limit
  skipSuccessfulRequests: true,
  
  // Don't count failed requests (helps with debugging)
  skipFailedRequests: false,
  
  // Custom handler for rate limit exceeded
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      type: 'authentication attempts'
    });
  },
  
  // Use default IP handling (no custom keyGenerator to avoid IPv6 issues)
  
  // Headers to include in response
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers (we set custom ones)
  
  // Store in memory (consider Redis for production scaling)
  // store: new RedisStore({ ... }) for production
});

/**
 * Global API Rate Limiter
 * General protection for all API endpoints
 * - 1000 requests per 15 minutes per IP
 * - Applies to all /api/* routes
 * - More lenient than auth limiter
 */
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: createRateLimitMessage({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    type: 'API requests'
  }),
  
  // Count all requests
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  
  // Custom handler for rate limit exceeded
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      type: 'API requests'
    });
  },
  
  // Use default IP handling
  
  // Headers to include in response
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Aggressive Rate Limiter for Suspicious Activity
 * Very strict rate limiting for IPs showing suspicious behavior
 * - 10 requests per 5 minutes
 * - Can be applied dynamically to specific IPs
 */
const suspiciousActivityRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit to 10 requests per 5 minutes
  message: createRateLimitMessage({
    windowMs: 5 * 60 * 1000,
    max: 10,
    type: 'requests (suspicious activity detected)'
  }),
  
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  
  handler: (req, res, next, options) => {
    // Log suspicious activity
    console.error('Suspicious activity blocked:', {
      ip: req.ip || req.connection?.remoteAddress,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    });
    
    rateLimitHandler(req, res, next, {
      ...options,
      type: 'requests (suspicious activity detected)'
    });
  },
  
  // Use default IP handling
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password Reset Rate Limiter
 * Specific rate limiting for password reset requests
 * - 3 attempts per hour per IP
 * - Prevents password reset spam
 */
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 password reset attempts per hour
  message: createRateLimitMessage({
    windowMs: 60 * 60 * 1000,
    max: 3,
    type: 'password reset attempts'
  }),
  
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      type: 'password reset attempts'
    });
  },
  
  // Use default IP handling
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Registration Rate Limiter
 * Specific rate limiting for user registration
 * - 3 registration attempts per hour per IP
 * - Prevents spam registrations
 */
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 registration attempts per hour
  message: createRateLimitMessage({
    windowMs: 60 * 60 * 1000,
    max: 3,
    type: 'registration attempts'
  }),
  
  skipSuccessfulRequests: true, // Don't count successful registrations
  skipFailedRequests: false,
  
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      type: 'registration attempts'
    });
  },
  
  // Use default IP handling (removed custom keyGenerator to avoid IPv6 issues)
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Dynamic IP Blocking Middleware
 * Tracks failed authentication attempts and applies aggressive rate limiting
 * to IPs showing suspicious patterns
 */
const ipBlockingTracker = {
  // In-memory storage for tracking failed attempts
  // In production, use Redis or database
  failedAttempts: new Map(),
  blockedIPs: new Map(),
  
  /**
   * Track failed authentication attempt
   * @param {String} ip - IP address
   */
  trackFailedAttempt: (ip) => {
    const attempts = ipBlockingTracker.failedAttempts.get(ip) || 0;
    ipBlockingTracker.failedAttempts.set(ip, attempts + 1);
    
    // Block IP after 10 failed attempts in 15 minutes
    if (attempts + 1 >= 10) {
      const blockUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
      ipBlockingTracker.blockedIPs.set(ip, blockUntil);
      
      console.error('IP blocked due to suspicious activity:', {
        ip,
        failedAttempts: attempts + 1,
        blockDuration: '15 minutes',
        timestamp: new Date().toISOString()
      });
      
      // Clear failed attempts counter after blocking
      ipBlockingTracker.failedAttempts.delete(ip);
    }
  },
  
  /**
   * Check if IP is currently blocked
   * @param {String} ip - IP address
   * @returns {Boolean} - True if blocked
   */
  isBlocked: (ip) => {
    const blockUntil = ipBlockingTracker.blockedIPs.get(ip);
    if (!blockUntil) return false;
    
    if (Date.now() > blockUntil) {
      // Block has expired, remove from blocked list
      ipBlockingTracker.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  },
  
  /**
   * Clear failed attempts for an IP (on successful auth)
   * @param {String} ip - IP address
   */
  clearFailedAttempts: (ip) => {
    ipBlockingTracker.failedAttempts.delete(ip);
  },
  
  /**
   * Manually unblock an IP (admin function)
   * @param {String} ip - IP address
   */
  unblockIP: (ip) => {
    ipBlockingTracker.blockedIPs.delete(ip);
    ipBlockingTracker.failedAttempts.delete(ip);
    
    console.info('IP manually unblocked:', {
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * IP Blocking Middleware
 * Checks if IP is blocked before processing request
 */
const ipBlockingMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (ipBlockingTracker.isBlocked(ip)) {
    const blockUntil = ipBlockingTracker.blockedIPs.get(ip);
    const remainingTime = Math.round((blockUntil - Date.now()) / 60000);
    
    console.warn('Blocked IP attempted access:', {
      ip,
      path: req.path,
      method: req.method,
      remainingBlockTime: `${remainingTime} minutes`,
      timestamp: new Date().toISOString()
    });
    
    return res.status(429).json({
      success: false,
      error: {
        code: 'IP_BLOCKED',
        message: `Your IP has been temporarily blocked due to suspicious activity. Please try again in ${remainingTime} minutes.`,
        retryAfter: remainingTime,
        timestamp: new Date().toISOString(),
        type: 'ip_block'
      }
    });
  }
  
  next();
};

/**
 * Rate Limit Info Middleware
 * Adds rate limit information to all API responses
 */
const rateLimitInfoMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Add rate limit info if headers exist
    const rateLimitInfo = {};
    
    if (res.get('X-RateLimit-Limit')) {
      rateLimitInfo.limit = parseInt(res.get('X-RateLimit-Limit'));
    }
    if (res.get('X-RateLimit-Remaining')) {
      rateLimitInfo.remaining = parseInt(res.get('X-RateLimit-Remaining'));
    }
    if (res.get('X-RateLimit-Reset')) {
      rateLimitInfo.reset = res.get('X-RateLimit-Reset');
    }
    
    // Only add rate limit info if we have any data and it's not an error response
    if (Object.keys(rateLimitInfo).length > 0 && data && data.success !== false) {
      data.rateLimit = rateLimitInfo;
    }
    
    originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  // Primary rate limiters
  authRateLimit,
  globalRateLimit,
  
  // Specific rate limiters
  passwordResetRateLimit,
  registrationRateLimit,
  suspiciousActivityRateLimit,
  
  // IP blocking functionality
  ipBlockingMiddleware,
  ipBlockingTracker,
  
  // Utility middleware
  rateLimitInfoMiddleware,
  
  // Utility functions
  createRateLimitMessage,
  rateLimitHandler
};