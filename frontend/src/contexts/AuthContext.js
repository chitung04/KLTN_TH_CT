import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authAPI from '../services/authAPI';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Enhanced Authentication Provider with React Context API
 * 
 * Features:
 * - User state and loading state management
 * - Automatic token persistence in localStorage
 * - Token expiration handling and automatic logout
 * - HTTP client configuration with interceptors
 * - Error handling and retry logic
 * - Session persistence across page reloads
 * 
 * Validates Requirements:
 * - 2.5: Session state management
 * - 7.5: Token persistence
 * - 7.6: Token expiration handling
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Clear authentication state and notify user
   */
  const handleTokenExpiration = useCallback(() => {
    console.warn('Token expired, logging out user');
    setUser(null);
    authAPI.clearStoredToken();
    setError({
      type: 'TOKEN_EXPIRED',
      message: 'Your session has expired. Please log in again.'
    });
  }, []);

  /**
   * Handle authentication errors (rate limiting, etc.)
   */
  const handleAuthError = useCallback((errorInfo) => {
    console.warn('Auth error:', errorInfo);
    setError(errorInfo);
  }, []);

  /**
   * Initialize authentication state on app start
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Setup API event handlers
        authAPI.setEventHandlers({
          onTokenExpired: handleTokenExpiration,
          onAuthError: handleAuthError
        });

        // Check if we have a stored token
        const token = authAPI.getStoredToken();
        if (token) {
          try {
            // Validate token by fetching user profile
            const response = await authAPI.getProfile();
            if (response.success && response.user) {
              setUser(response.user);
            } else {
              // Invalid token, clear it
              authAPI.clearStoredToken();
            }
          } catch (error) {
            // Token validation failed, clear it
            console.warn('Token validation failed:', error.message);
            authAPI.clearStoredToken();
            
            // Only set error if it's not a token expiration (handled by interceptor)
            if (error.code !== 'TOKEN_EXPIRED' && error.code !== 'TOKEN_INVALID') {
              setError({
                type: 'VALIDATION_ERROR',
                message: 'Unable to validate your session. Please log in again.'
              });
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError({
          type: 'INITIALIZATION_ERROR',
          message: 'Failed to initialize authentication. Please refresh the page.'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [handleTokenExpiration, handleAuthError]);

  /**
   * Login with credentials
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login(credentials);
      
      if (response.success && response.user && response.token) {
        // Store token and update user state
        authAPI.setStoredToken(response.token);
        setUser(response.user);
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during login';
      setError({
        type: 'LOGIN_ERROR',
        message: errorMessage,
        code: error.code
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.register(userData);
      
      if (response.success && response.user && response.token) {
        // Store token and update user state
        authAPI.setStoredToken(response.token);
        setUser(response.user);
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during registration';
      setError({
        type: 'REGISTRATION_ERROR',
        message: errorMessage,
        code: error.code,
        details: error.details
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call logout API (non-blocking)
      await authAPI.logout();
    } catch (error) {
      // Logout should succeed even if API call fails
      console.warn('Logout API call failed:', error.message);
    } finally {
      // Always clear local state
      setUser(null);
      setError(null);
      authAPI.clearStoredToken();
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.updateProfile(profileData);
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during profile update';
      setError({
        type: 'PROFILE_UPDATE_ERROR',
        message: errorMessage,
        code: error.code,
        details: error.details
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Change user password
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.changePassword(passwordData);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during password change';
      setError({
        type: 'PASSWORD_CHANGE_ERROR',
        message: errorMessage,
        code: error.code
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.forgotPassword(email);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Password reset request failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during password reset request';
      setError({
        type: 'FORGOT_PASSWORD_ERROR',
        message: errorMessage,
        code: error.code
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.resetPassword(token, newPassword);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Network error during password reset';
      setError({
        type: 'RESET_PASSWORD_ERROR',
        message: errorMessage,
        code: error.code
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh user profile from server
   */
  const refreshProfile = useCallback(async () => {
    try {
      setError(null);
      const response = await authAPI.getProfile();
      
      if (response.success && response.user) {
        setUser(response.user);
        return response.user;
      } else {
        throw new Error('Failed to refresh profile');
      }
    } catch (error) {
      console.warn('Profile refresh failed:', error.message);
      // Don't set error for profile refresh failures
      throw error;
    }
  }, []);

  // Context value with all authentication methods and state
  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,
    
    // Methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshProfile,
    clearError,
    
    // Utility getters
    getUserRole: () => user?.role || null,
    getUserId: () => user?.id || null,
    getUserEmail: () => user?.email || null,
    isRole: (role) => user?.role === role,
    hasRole: (roles) => Array.isArray(roles) ? roles.includes(user?.role) : user?.role === roles,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};