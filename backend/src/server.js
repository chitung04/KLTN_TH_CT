const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

// Import security middleware
const { securityMiddleware, securityAuditMiddleware } = require('./middleware/securityMiddleware');

// Import rate limiting middleware
const { 
  globalRateLimit, 
  authRateLimit, 
  ipBlockingMiddleware, 
  rateLimitInfoMiddleware 
} = require('./middleware/rateLimitMiddleware');

const app = express();

/**
 * Middleware Application Order (CRITICAL)
 * Order matters for security and functionality
 * 
 * Task 5.3: Configure /api/auth routes with rate limiting and validation
 * Requirements validated: 8.1, 8.2, 8.3, 8.4
 */

// 1. CORS configuration (MUST BE FIRST to handle preflight requests)
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port and local network
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') return pattern === origin;
      return pattern.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 2. Body parsing middleware (required before routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. IP blocking middleware (security)
app.use(ipBlockingMiddleware);

// 4. Security headers and audit logging
app.use(securityMiddleware);
app.use(securityAuditMiddleware);

// 5. Rate limiting for API routes
app.use('/api', globalRateLimit);

// 6. Rate limit info middleware (adds headers to responses)
app.use(rateLimitInfoMiddleware);

// Database connection configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // Enhanced connection settings for security and performance
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    timeout: 60000,
    acquireTimeout: 60000,
    reconnect: true
});

// Database connection with enhanced error handling
db.connect((err) => {
    if (err) {
        console.error('❌ MySQL Database Connection Error (Port 3306):', err.message);
        console.error('Connection Details:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        // Don't exit in development for better debugging
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        return;
    }
    console.log('✅ Successfully connected to MySQL Database (Port 3306)!');
    console.log(`📊 Database: ${process.env.DB_NAME} | Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'THCT Clinic API is running successfully!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

/**
 * Route Configuration with Authentication Middleware
 * 
 * Task 5.3 Implementation:
 * - /api/auth routes configured with rate limiting and validation
 * - /api/appointments routes protected with authentication middleware
 * - /api/users routes configured with role-based access control
 * 
 * Requirements validated:
 * - 8.1: Auth middleware protects all appointment endpoints requiring authentication
 * - 8.2: Auth middleware allows access to public endpoints without token
 * - 8.3: Return 401 with "Token not provided" when API receives request without token
 * - 8.4: Return 401 with "Invalid token" when API receives invalid token
 */

// Import route modules
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const medicalRecordsRoutes = require('./routes/medicalRecordsRoutes');
const queueRoutes = require('./routes/queueRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

// Apply routes with authentication middleware
app.use('/api/appointments', appointmentRoutes); // Protected endpoints with auth middleware
app.use('/api/auth', authRoutes);                // Public and protected auth endpoints
app.use('/api/users', userRoutes);               // Protected user management endpoints
app.use('/api/medical-records', medicalRecordsRoutes); // Medical records endpoints with role-based access
app.use('/api/queue', queueRoutes);              // Queue management and tracking endpoints
app.use('/api/statistics', statisticsRoutes);    // Statistics and reporting endpoints (admin only)

// Legacy departments endpoint (consider moving to appointmentRoutes)
app.get('/api/departments', (req, res) => {
    db.query('SELECT * FROM departments', (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ 
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to retrieve departments'
                }
            });
        }
        res.json({
            success: true,
            departments: results
        });
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    
    // JWT specific errors
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_INVALID',
                message: 'Invalid token'
            }
        });
    }
    
    // Database errors
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({
            success: false,
            error: {
                code: 'DATABASE_UNAVAILABLE',
                message: 'Database connection lost'
            }
        });
    }
    
    // Generic server error
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : err.message
        }
    });
});

// 404 Handler for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.originalUrl} not found`
        }
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    db.end(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    db.end(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 THCT Clinic API Server running at http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Authentication: JWT with ${process.env.JWT_EXPIRES_IN || '24h'} expiration`);
    console.log(`🛡️  Security: Rate limiting and IP blocking enabled`);
});