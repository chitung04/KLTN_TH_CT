import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ProtectedRoute.css';

/**
 * ProtectedRoute Component - Enhanced Route Protection with Role-Based Access Control
 * 
 * Features:
 * - Authentication checking with proper redirects
 * - Role-based access control (RBAC) for patient, doctor, receptionist, admin
 * - Loading states while checking authentication
 * - Return URL preservation for post-login redirects
 * - 403 Forbidden error display for unauthorized access
 * - Customizable fallback UI
 * - Support for multiple required roles (OR logic)
 * 
 * Requirements Validation:
 * - Requirement 3.1: Patient role access control
 * - Requirement 3.2: Doctor role access control
 * - Requirement 3.3: Receptionist role access control
 * - Requirement 3.4: Admin role access control
 * - Requirement 3.6: 403 Forbidden for unauthorized access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render when authorized
 * @param {string|string[]|null} props.requiredRole - Required role(s) for access (null = any authenticated user)
 * @param {React.ReactNode} props.fallback - Custom component for unauthenticated users
 * @param {React.ReactNode} props.unauthorizedFallback - Custom component for unauthorized users (wrong role)
 * @param {Function} props.onAuthRequired - Callback when authentication is required
 * @param {Function} props.onUnauthorized - Callback when user lacks required role
 * @param {boolean} props.preserveReturnUrl - Whether to preserve current page for return after login (default: true)
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallback = null,
  unauthorizedFallback = null,
  onAuthRequired = null,
  onUnauthorized = null,
  preserveReturnUrl = true
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Store return URL for redirect after login
  useEffect(() => {
    if (!isAuthenticated && !loading && preserveReturnUrl) {
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/') {
        sessionStorage.setItem('returnUrl', currentPath);
      }
    }
  }, [isAuthenticated, loading, preserveReturnUrl]);

  // Callback for authentication required
  const handleAuthRequired = useCallback(() => {
    if (onAuthRequired) {
      onAuthRequired();
    }
  }, [onAuthRequired]);

  // Callback for unauthorized access
  const handleUnauthorized = useCallback(() => {
    if (onUnauthorized) {
      onUnauthorized(user?.role, requiredRole);
    }
  }, [onUnauthorized, user, requiredRole]);

  // Loading state - Show spinner while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  // Not authenticated - Show login prompt or custom fallback
  if (!isAuthenticated || !user) {
    handleAuthRequired();
    
    return fallback || (
      <div className="protected-route-unauthenticated">
        <div className="auth-required-icon">🔒</div>
        <h3 className="auth-required-title">Yêu cầu đăng nhập</h3>
        <p className="auth-required-message">
          Bạn cần đăng nhập để truy cập trang này.
        </p>
        <div className="auth-required-actions">
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Đăng nhập
          </button>
        </div>
        <p className="auth-required-hint">
          Trang này yêu cầu xác thực để bảo vệ dữ liệu cá nhân của bạn.
        </p>
      </div>
    );
  }

  // Check role-based access control
  if (requiredRole && !checkRole(user.role, requiredRole)) {
    handleUnauthorized();
    
    return unauthorizedFallback || (
      <div className="protected-route-unauthorized">
        <div className="unauthorized-icon">⛔</div>
        <h3 className="unauthorized-title">403 - Không có quyền truy cập</h3>
        <p className="unauthorized-message">
          Bạn không có quyền truy cập trang này với vai trò hiện tại.
        </p>
        <div className="unauthorized-details">
          <div className="role-info">
            <span className="role-label">Vai trò hiện tại:</span>
            <span className="role-badge role-current">{getRoleDisplayName(user.role)}</span>
          </div>
          <div className="role-info">
            <span className="role-label">Vai trò yêu cầu:</span>
            <span className="role-badge role-required">
              {Array.isArray(requiredRole) 
                ? requiredRole.map(getRoleDisplayName).join(' hoặc ')
                : getRoleDisplayName(requiredRole)}
            </span>
          </div>
        </div>
        <p className="unauthorized-hint">
          Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập này.
        </p>
      </div>
    );
  }

  // Authorized - Render protected content
  return children;
};

/**
 * Check if user role matches required role(s)
 * Supports both single role and multiple roles (OR logic)
 * 
 * @param {string} userRole - Current user's role
 * @param {string|string[]} requiredRole - Required role(s)
 * @returns {boolean} True if user has required role
 */
const checkRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) {
    return false;
  }

  // Single role requirement
  if (typeof requiredRole === 'string') {
    return userRole === requiredRole;
  }

  // Multiple roles requirement (OR logic)
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }

  return false;
};

/**
 * Get Vietnamese display name for user role
 * 
 * @param {string} role - User role (patient, doctor, receptionist, admin)
 * @returns {string} Vietnamese role name
 */
const getRoleDisplayName = (role) => {
  const roleNames = {
    'patient': 'Bệnh nhân',
    'doctor': 'Bác sĩ',
    'receptionist': 'Lễ tân',
    'admin': 'Quản trị viên'
  };

  return roleNames[role] || role;
};

/**
 * Role-based resource access mapping
 * Defines which roles can access which resources
 * 
 * Validates Requirements:
 * - 3.1: Patient can access booking and their own medical records
 * - 3.2: Doctor can access doctor queue and assigned patient records
 * - 3.3: Receptionist can access check-in QR and appointment management
 * - 3.4: Admin can access all system management functions
 */
export const ROLE_PERMISSIONS = {
  patient: ['booking', 'medical-records-own', 'profile', 'appointments-own'],
  doctor: ['doctor-queue', 'medical-records-assigned', 'profile', 'appointments-doctor'],
  receptionist: ['qr-checkin', 'appointment-management', 'profile', 'check-in'],
  admin: ['all'] // Admin has access to all resources
};

/**
 * Check if user has permission to access a specific resource
 * 
 * @param {string} userRole - User's role
 * @param {string} resource - Resource to check access for
 * @returns {boolean} True if user has access
 */
export const hasResourceAccess = (userRole, resource) => {
  if (!userRole || !resource) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[userRole];
  
  if (!permissions) {
    return false;
  }

  // Admin has access to everything
  if (permissions.includes('all')) {
    return true;
  }

  // Check specific permission
  return permissions.includes(resource);
};

export default ProtectedRoute;