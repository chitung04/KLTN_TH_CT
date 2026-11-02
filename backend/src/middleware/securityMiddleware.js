const helmet = require('helmet');

/**
 * Security Headers Middleware using Helmet
 * Configures comprehensive security headers to protect against common web vulnerabilities
 */
const securityMiddleware = helmet({
  // Content Security Policy - prevents XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles for React components
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts for development (should be removed in production)
        "'unsafe-eval'", // Allow eval for development tools (should be removed in production)
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:", // Allow data URLs for base64 images (QR codes)
        "blob:", // Allow blob URLs for generated images
        "https:"
      ],
      connectSrc: [
        "'self'",
        "https://api.thctclinic.vn", // API domain if different
        "ws://localhost:3000", // WebSocket for development
        "wss://thctclinic.vn" // Secure WebSocket for production
      ],
      objectSrc: ["'none'"], // Disable plugins
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"], // Prevent embedding in frames
    }
  },

  // Strict Transport Security - forces HTTPS
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // XSS Protection
  xssFilter: true,

  // Clickjacking protection
  frameguard: {
    action: 'deny' // Completely deny framing
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Referrer Policy - controls referrer information
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin']
  },

  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    camera: ['self'],
    microphone: [],
    geolocation: ['self'],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disable for now to avoid blocking resources

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin' // Allow cross-origin requests for API
  }
});

/**
 * Development-specific security middleware with relaxed policies
 * Used in development environment for easier debugging
 */
const developmentSecurityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: false, // Disable HSTS in development
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  referrerPolicy: { policy: ['strict-origin-when-cross-origin'] },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

/**
 * Get appropriate security middleware based on environment
 * @returns {Function} Configured Helmet middleware
 */
const getSecurityMiddleware = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const middleware = isDevelopment ? developmentSecurityMiddleware : securityMiddleware;
  
  console.log(`Security headers configured for ${isDevelopment ? 'development' : 'production'} environment`);
  
  return middleware;
};

/**
 * Security audit middleware for logging security-related headers
 * Logs important security headers for monitoring and compliance
 */
const securityAuditMiddleware = (req, res, next) => {
  // Log security-relevant request headers
  const securityHeaders = {
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    xForwardedFor: req.get('X-Forwarded-For'),
    xRealIp: req.get('X-Real-IP'),
    authorization: req.get('Authorization') ? 'Bearer token present' : 'No auth token'
  };

  // Add security audit info to request for later logging
  req.securityAudit = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    headers: securityHeaders,
    path: req.path,
    method: req.method
  };

  // Override res.end to log security headers being sent
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Log important response headers for security audit
    const responseSecurityHeaders = {
      'content-security-policy': res.get('Content-Security-Policy'),
      'strict-transport-security': res.get('Strict-Transport-Security'),
      'x-frame-options': res.get('X-Frame-Options'),
      'x-content-type-options': res.get('X-Content-Type-Options'),
      'x-xss-protection': res.get('X-XSS-Protection'),
      'referrer-policy': res.get('Referrer-Policy')
    };

    // Only log security headers in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || process.env.LOG_SECURITY_HEADERS === 'true') {
      console.log('Security Headers Applied:', responseSecurityHeaders);
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = {
  securityMiddleware: getSecurityMiddleware(),
  securityAuditMiddleware,
  developmentSecurityMiddleware,
  getSecurityMiddleware
};