/**
 * Authentication Utilities
 * Provides helper functions for authentication-related operations
 * 
 * Features:
 * - Token validation and parsing
 * - Role checking utilities
 * - Error message standardization
 * - Form validation helpers
 */

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch (error) {
    return true;
  }
};

/**
 * Parse JWT token payload
 */
export const parseToken = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Get user role from token
 */
export const getRoleFromToken = (token) => {
  const payload = parseToken(token);
  return payload?.role || null;
};

/**
 * Check if user has required role(s)
 */
export const hasRole = (userRole, requiredRoles) => {
  if (!userRole) return false;
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }
  
  return userRole === requiredRoles;
};

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY = {
  'admin': 4,
  'receptionist': 3,
  'doctor': 2,
  'patient': 1
};

/**
 * Check if user role has sufficient permissions
 */
export const hasPermissionLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate Vietnamese phone number
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone);
};

/**
 * Format authentication errors for display
 */
export const formatAuthError = (error) => {
  const errorMessages = {
    'INVALID_CREDENTIALS': 'Email or password is incorrect',
    'DUPLICATE_EMAIL': 'This email is already registered',
    'DUPLICATE_PHONE': 'This phone number is already registered',
    'WEAK_PASSWORD': 'Password does not meet security requirements',
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'TOKEN_INVALID': 'Invalid session. Please log in again.',
    'ACCOUNT_LOCKED': 'Account is temporarily locked due to multiple failed login attempts',
    'RATE_LIMITED': 'Too many requests. Please try again later.',
    'NETWORK_ERROR': 'Network error. Please check your connection.',
    'VALIDATION_ERROR': 'Please check your input and try again',
    'INTERNAL_ERROR': 'An unexpected error occurred. Please try again.',
  };

  if (typeof error === 'string') {
    return error;
  }

  if (error?.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if current time is within business hours
 */
export const isBusinessHours = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Business hours: Monday-Friday 8 AM to 6 PM, Saturday 8 AM to 12 PM
  if (day >= 1 && day <= 5) { // Monday to Friday
    return hour >= 8 && hour < 18;
  } else if (day === 6) { // Saturday
    return hour >= 8 && hour < 12;
  }
  
  return false; // Sunday or outside business hours
};

/**
 * Get appropriate dashboard route for user role
 */
export const getDashboardRoute = (role) => {
  const routes = {
    'patient': '/dashboard/patient',
    'doctor': '/dashboard/doctor',
    'receptionist': '/dashboard/receptionist',
    'admin': '/dashboard/admin'
  };
  
  return routes[role] || '/dashboard';
};

/**
 * Generate user avatar initials
 */
export const getAvatarInitials = (fullName) => {
  if (!fullName) return '??';
  
  const names = fullName.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  } else {
    return names[0].substring(0, 2).toUpperCase();
  }
};

/**
 * Format user display name
 */
export const formatUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  
  if (user.role === 'doctor' && user.fullName) {
    return `Dr. ${user.fullName}`;
  }
  
  return user.fullName || user.email || 'Unknown User';
};

/**
 * Session storage utilities (fallback for localStorage)
 */
export const storage = {
  get: (key) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch (error) {
      console.warn('Storage access failed:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage failed, using sessionStorage:', error);
      try {
        sessionStorage.setItem(key, value);
      } catch (sessionError) {
        console.error('All storage methods failed:', sessionError);
      }
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Storage removal failed:', error);
    }
  }
};

/**
 * Debounce function for form validation
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  isTokenExpired,
  parseToken,
  getRoleFromToken,
  hasRole,
  hasPermissionLevel,
  validateEmail,
  validatePassword,
  validatePhone,
  formatAuthError,
  isBusinessHours,
  getDashboardRoute,
  getAvatarInitials,
  formatUserDisplayName,
  storage,
  debounce,
  ROLE_HIERARCHY
};