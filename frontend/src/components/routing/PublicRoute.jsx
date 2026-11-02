import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ProtectedRoute.css';

/**
 * PublicRoute Component - Route wrapper for public pages (login/register)
 * 
 * Features:
 * - Redirects authenticated users away from login/register pages
 * - Allows access to public marketing/info pages
 * - Handles deep linking to protected routes after login
 * - Preserves return URL for post-login redirect
 * - Loading states while checking authentication
 * 
 * Requirements Validation:
 * - Requirement 2.6: Redirect authenticated users away from login/register pages
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render for public access
 * @param {boolean} props.restricted - If true, authenticated users are redirected (default: false)
 * @param {string} props.redirectTo - Where to redirect authenticated users (default: 'dashboard')
 * @param {Function} props.onRedirect - Callback when redirect occurs
 */
const PublicRoute = ({ 
  children, 
  restricted = false,
  redirectTo = 'dashboard',
  onRedirect = null
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Handle redirect for authenticated users on restricted public pages
  useEffect(() => {
    if (!loading && isAuthenticated && restricted) {
      // Get return URL from session storage if available
      const returnUrl = sessionStorage.getItem('returnUrl');
      
      if (returnUrl) {
        // Clear return URL and redirect to it
        sessionStorage.removeItem('returnUrl');
        
        if (onRedirect) {
          // Extract page name from return URL (e.g., '/dashboard' -> 'dashboard')
          const pageName = returnUrl.replace('/', '').split('?')[0] || redirectTo;
          onRedirect(pageName);
        }
      } else {
        // No return URL, redirect to default (dashboard)
        if (onRedirect) {
          onRedirect(redirectTo);
        }
      }
    }
  }, [loading, isAuthenticated, restricted, redirectTo, onRedirect]);

  // Loading state - Show spinner while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang kiểm tra trạng thái đăng nhập...</p>
      </div>
    );
  }

  // Authenticated user on restricted page (login/register) - Show redirect message
  if (isAuthenticated && restricted) {
    return (
      <div className="public-route-redirect">
        <div className="redirect-icon">✅</div>
        <h3 className="redirect-title">Bạn đã đăng nhập</h3>
        <p className="redirect-message">
          Đang chuyển hướng đến trang chủ...
        </p>
        <div className="redirect-spinner">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Public access - Render content
  return children;
};

export default PublicRoute;
