const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Database Configuration and Connection Pool
 * Provides centralized database connection management for the authentication system
 * Uses connection pooling for optimal performance
 */

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    
    // Connection pooling for performance optimization
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    
    // Reconnection settings
    reconnect: true,
    
    // Performance optimizations
    multipleStatements: false,
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection on startup
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Initialize connection test
testConnection();

/**
 * Execute a database query with automatic connection handling
 * @param {String} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

/**
 * Execute a query and return the first result row
 * @param {String} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} First row or null
 */
const queryFirst = async (query, params = []) => {
    try {
        const results = await executeQuery(query, params);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if database connection is healthy
 * @returns {Promise<Boolean>} Connection status
 */
const isHealthy = async () => {
    try {
        await executeQuery('SELECT 1');
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Transaction helper function
 * @param {Function} callback - Callback function that receives connection
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    executeQuery,
    queryFirst,
    isHealthy,
    transaction,
    testConnection
};