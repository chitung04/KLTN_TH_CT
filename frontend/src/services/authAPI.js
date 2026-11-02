/**
 * Authentication API Service Layer
 * Provides HTTP client configuration with interceptors for the THCT Clinic authentication system
 * 
 * Features:
 * - Automatic Authorization header injection
 * - Token expiration handling and automatic logout
 * - Request/response interceptors
 * - Retry logic for transient failures
 * - Error handling and standardized responses
 * 
 * Validates Requirements:
 * - 4.5: HTTP client configuration with interceptors
 * - 7.6: Token expiration handling
 * - Error handling and retry mechanisms
 */

import axios from 'axios';

// API Configuration
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const TOKEN_KEY = 'auth_token';

// Retry Configuration
const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_MULTIPLIER: 2
};

/**
 * HTTP Client with authentication interceptors
 */
class AuthAPI {
    constructor() {
        // Create axios instance with base configuration
        this.client = axios.create({
            baseURL: API_BASE,
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Track authentication callbacks
        this.onTokenExpired = null;
        this.onAuthError = null;
        
        // Track retry attempts for requests
        this.retryAttempts = new Map();

        // Setup interceptors
        this.setupRequestInterceptor();
        this.setupResponseInterceptor();
    }

    /**
     * Configure authentication event handlers
     */
    setEventHandlers({ onTokenExpired, onAuthError }) {
        this.onTokenExpired = onTokenExpired;
        this.onAuthError = onAuthError;
    }

    /**
     * Request interceptor - automatically add Authorization header
     */
    setupRequestInterceptor() {
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getStoredToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                
                // Add request metadata for monitoring and retry logic
                config.metadata = { 
                    startTime: new Date(),
                    retryCount: this.retryAttempts.get(config.url + config.method) || 0
                };
                
                // Log request for debugging (excluding sensitive data)
                const logData = {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    hasToken: !!token,
                    retryCount: config.metadata.retryCount
                };
                console.debug('API Request:', logData);
                
                return config;
            },
            (error) => {
                console.error('Request interceptor error:', error);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Response interceptor - handle token expiration and errors with enhanced retry logic
     */
    setupResponseInterceptor() {
        this.client.interceptors.response.use(
            (response) => {
                // Calculate request duration for monitoring
                if (response.config.metadata) {
                    const duration = new Date() - response.config.metadata.startTime;
                    const retryCount = response.config.metadata.retryCount;
                    
                    console.debug(`Request to ${response.config.url} completed in ${duration}ms${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`);
                    
                    // Clear retry tracking for successful requests
                    const requestKey = response.config.url + response.config.method;
                    this.retryAttempts.delete(requestKey);
                }
                
                return response;
            },
            async (error) => {
                const originalRequest = error.config;
                const requestKey = originalRequest.url + originalRequest.method;

                // Handle token expiration (401 Unauthorized)
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    // Check if it's a token expiration issue
                    const errorCode = error.response.data?.error?.code;
                    if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID') {
                        console.warn('Token expired, notifying auth context');
                        
                        // Clear retry tracking
                        this.retryAttempts.delete(requestKey);
                        
                        // Notify auth context about token expiration
                        if (this.onTokenExpired) {
                            this.onTokenExpired();
                        }
                        
                        // Don't retry the request, let user re-authenticate
                        return Promise.reject(error);
                    }
                }

                // Handle retryable errors with exponential backoff
                if (this.isRetryableError(error) && this.shouldRetry(requestKey)) {
                    const retryCount = this.retryAttempts.get(requestKey) || 0;
                    this.retryAttempts.set(requestKey, retryCount + 1);
                    
                    const delay = this.calculateBackoffDelay(retryCount);
                    
                    console.warn(`Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.MAX_RETRIES})`);
                    
                    // Wait for the calculated delay
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Retry the request
                    return this.client(originalRequest);
                }

                // Handle rate limiting (429 Too Many Requests)
                if (error.response?.status === 429) {
                    const retryAfter = error.response.headers['retry-after'] || 60;
                    console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
                    
                    // Clear retry tracking
                    this.retryAttempts.delete(requestKey);
                    
                    // Notify about rate limiting
                    if (this.onAuthError) {
                        this.onAuthError({
                            type: 'RATE_LIMITED',
                            message: `Too many requests. Please wait ${retryAfter} seconds.`,
                            retryAfter
                        });
                    }
                }

                // Clear retry tracking for non-retryable failures
                this.retryAttempts.delete(requestKey);
                
                return Promise.reject(error);
            }
        );
    }

    /**
     * Check if error is retryable (network issues, server errors)
     */
    isRetryableError(error) {
        return (
            !error.response || // Network error
            (error.response.status >= 500 && error.response.status < 600) || // Server error
            error.code === 'ECONNRESET' || // Connection reset
            error.code === 'ENOTFOUND' || // DNS lookup failed
            error.code === 'ECONNREFUSED' || // Connection refused
            error.code === 'ETIMEDOUT' // Request timeout
        );
    }

    /**
     * Check if we should retry the request based on retry count
     */
    shouldRetry(requestKey) {
        const retryCount = this.retryAttempts.get(requestKey) || 0;
        return retryCount < RETRY_CONFIG.MAX_RETRIES;
    }

    /**
     * Calculate exponential backoff delay for retries
     */
    calculateBackoffDelay(retryCount) {
        const delay = Math.min(
            RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount),
            RETRY_CONFIG.MAX_DELAY
        );
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        
        return Math.floor(delay + jitter);
    }

    /**
     * Get stored authentication token
     */
    getStoredToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Store authentication token
     */
    setStoredToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    /**
     * Clear authentication token
     */
    clearStoredToken() {
        localStorage.removeItem(TOKEN_KEY);
    }

    /**
     * User Authentication Methods
     */

    /**
     * User login
     */
    async login(credentials) {
        try {
            const response = await this.client.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            throw this.handleAPIError(error, 'Login failed');
        }
    }

    /**
     * User registration
     */
    async register(userData) {
        try {
            const response = await this.client.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw this.handleAPIError(error, 'Registration failed');
        }
    }

    /**
     * User logout
     */
    async logout() {
        try {
            const response = await this.client.post('/auth/logout');
            return response.data;
        } catch (error) {
            // Logout should succeed even if API call fails
            console.warn('Logout API call failed, proceeding with local logout:', error.message);
            return { success: true, message: 'Logged out locally' };
        }
    }

    /**
     * Get current user profile
     */
    async getProfile() {
        try {
            const response = await this.client.get('/auth/profile');
            return response.data;
        } catch (error) {
            throw this.handleAPIError(error, 'Failed to fetch profile');
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        try {
            const response = await this.client.put('/users/profile', profileData);
            return response.data;
        } catch (error) {
            throw this.handleAPIError(error, 'Profile update failed');
        }
    }

    /**
     * Change user password
     */
    async changePassword(passwordData) {
        try {
            const response = await this.client.put('/users/change-password', passwordData);
            return response.data;
        } catch (error) {
            throw this.handleAPIError(error, 'Password change failed');
        }
    }

    /**
     * Forgot password
     */
    async forgotPassword(email) {
        try {
            const response = await this.client.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            throw this.handleAPIError(error, 'Password reset request failed');
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await this.client.post('/auth/reset-password', {
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw this.handleAPIError(error, 'Password reset failed');
        }
    }

    /**
     * Handle API errors and create standardized error objects
     */
    handleAPIError(error, defaultMessage) {
        let errorMessage = defaultMessage;
        let errorCode = 'UNKNOWN_ERROR';
        let details = null;
        let isRetryable = false;

        if (error.response) {
            // Server responded with error status
            const responseData = error.response.data;
            
            if (responseData?.error) {
                errorCode = responseData.error.code || 'SERVER_ERROR';
                errorMessage = responseData.error.message || responseData.message || defaultMessage;
                details = responseData.error.details;
            } else if (responseData?.message) {
                errorMessage = responseData.message;
            }

            // Check if this error type is retryable
            isRetryable = this.isRetryableError(error);
            
        } else if (error.request) {
            // Network error
            errorCode = 'NETWORK_ERROR';
            errorMessage = 'Network error. Please check your connection and try again.';
            isRetryable = true;
        } else {
            // Request setup error
            errorCode = 'REQUEST_ERROR';
            errorMessage = error.message || defaultMessage;
        }

        const apiError = new Error(errorMessage);
        apiError.code = errorCode;
        apiError.details = details;
        apiError.status = error.response?.status;
        apiError.isRetryable = isRetryable;
        
        // Add retry information if available
        const requestKey = error.config?.url + error.config?.method;
        if (requestKey && this.retryAttempts.has(requestKey)) {
            apiError.retryCount = this.retryAttempts.get(requestKey);
        }
        
        return apiError;
    }

    /**
     * Clear retry tracking for all requests
     */
    clearRetryTracking() {
        this.retryAttempts.clear();
        console.debug('Cleared retry tracking for all requests');
    }

    /**
     * Get current retry status for debugging
     */
    getRetryStatus() {
        const retryStatus = {};
        this.retryAttempts.forEach((count, key) => {
            retryStatus[key] = count;
        });
        return retryStatus;
    }

    /**
     * Test API connectivity with enhanced error reporting
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return {
                success: true,
                ...response.data,
                responseTime: response.config.metadata ? 
                    new Date() - response.config.metadata.startTime : null
            };
        } catch (error) {
            throw this.handleAPIError(error, 'Health check failed - API may be unavailable');
        }
    }
}

// Create singleton instance
const authAPI = new AuthAPI();

export default authAPI;