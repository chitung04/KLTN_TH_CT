import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import './AuthForms.css';

/**
 * Fallback UI Component for Authentication Errors
 * 
 * Provides user-friendly error display with retry options when authentication
 * components encounter errors
 * 
 * Features:
 * - User-friendly error messages
 * - Retry functionality for recoverable errors
 * - Network status detection and offline mode handling
 * - Technical details for debugging (dev mode)
 * - Accessible error messaging
 * 
 * Validates Requirements:
 * - Error handling with graceful degradation
 * - Network error detection and offline mode handling
 * - User-friendly error messages
 * - Retry functionality for recoverable errors
 */
const AuthErrorFallback = ({ 
  error, 
  errorInfo,
  errorCount = 0,
  onReset, 
  onNavigateAway,
  resetButtonText = 'Thử lại',
  showTechnicalDetails = false 
}) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showDetails, setShowDetails] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Auto-retry for network errors after 5 seconds
  useEffect(() => {
    if (!isOnline && errorCount < 3) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onReset) onReset();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isOnline, errorCount, onReset]);

  /**
   * Get user-friendly error message based on error type
   */
  const getUserFriendlyMessage = () => {
    if (!isOnline) {
      return {
        title: 'Không có kết nối mạng',
        message: 'Vui lòng kiểm tra kết nối internet của bạn và thử lại.',
        icon: 'network',
        severity: 'warning'
      };
    }

    if (isSlowConnection) {
      return {
        title: 'Kết nối chậm',
        message: 'Kết nối internet của bạn đang chậm. Thao tác có thể mất nhiều thời gian hơn bình thường.',
        icon: 'slow-network',
        severity: 'info'
      };
    }

    // Check error code/type
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';

    if (errorCode === 'NETWORK_ERROR' || errorMessage.includes('Network')) {
      return {
        title: 'Lỗi kết nối',
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        icon: 'network',
        severity: 'error'
      };
    }

    if (errorCode === 'TOKEN_EXPIRED') {
      return {
        title: 'Phiên đăng nhập hết hạn',
        message: 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.',
        icon: 'clock',
        severity: 'warning'
      };
    }

    if (errorCode === 'RATE_LIMITED') {
      return {
        title: 'Quá nhiều yêu cầu',
        message: 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại.',
        icon: 'alert',
        severity: 'warning'
      };
    }

    if (errorMessage.includes('timeout')) {
      return {
        title: 'Hết thời gian chờ',
        message: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
        icon: 'clock',
        severity: 'error'
      };
    }

    // Generic authentication error
    return {
      title: 'Đã xảy ra lỗi',
      message: 'Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.',
      icon: 'error',
      severity: 'error'
    };
  };

  const errorDisplay = getUserFriendlyMessage();

  /**
   * Render error icon based on type
   */
  const renderIcon = () => {
    const iconStyles = {
      width: '48px',
      height: '48px',
      marginBottom: '16px'
    };

    switch (errorDisplay.icon) {
      case 'network':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
            <line x1="2" y1="2" x2="22" y2="22" opacity="0.5" />
          </svg>
        );
      case 'slow-network':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" />
          </svg>
        );
      case 'clock':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'alert':
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return (
          <svg style={iconStyles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
    }
  };

  /**
   * Determine CSS class based on severity
   */
  const getSeverityClass = () => {
    switch (errorDisplay.severity) {
      case 'warning': return 'auth-error-warning';
      case 'info': return 'auth-error-info';
      case 'error':
      default:
        return 'auth-error-error';
    }
  };

  return (
    <div className="auth-form-container">
      <div className={`auth-error-fallback ${getSeverityClass()}`} role="alert" aria-live="assertive">
        <div className="auth-error-icon">
          {renderIcon()}
        </div>

        <h2 className="auth-error-title">{errorDisplay.title}</h2>
        <p className="auth-error-message">{errorDisplay.message}</p>

        {/* Network status indicators */}
        {!isOnline && (
          <div className="network-status offline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M8.5 16.5a5 5 0 0 1 7 0" />
              <path d="M2 8.5a14 14 0 0 1 20 0" />
            </svg>
            <span>Đang ngoại tuyến</span>
          </div>
        )}

        {isOnline && isSlowConnection && (
          <div className="network-status slow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            <span>Kết nối chậm</span>
          </div>
        )}

        {/* Auto-retry countdown */}
        {countdown !== null && (
          <div className="auth-error-countdown">
            Tự động thử lại sau {countdown} giây...
          </div>
        )}

        {/* Repeated error warning */}
        {errorCount >= 3 && (
          <div className="auth-error-repeated">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Lỗi này đã xảy ra {errorCount} lần. Nếu vấn đề tiếp diễn, vui lòng liên hệ hỗ trợ.</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="auth-error-actions">
          {onReset && (
            <button 
              className="btn-primary"
              onClick={onReset}
              disabled={countdown !== null}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {resetButtonText}
            </button>
          )}
          
          {onNavigateAway && (
            <button 
              className="btn-secondary"
              onClick={onNavigateAway}
            >
              Về trang chủ
            </button>
          )}
        </div>

        {/* Technical details toggle (for debugging) */}
        {showTechnicalDetails && error && (
          <div className="auth-error-technical">
            <button 
              className="auth-error-details-toggle"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
            >
              {showDetails ? 'Ẩn chi tiết kỹ thuật' : 'Hiện chi tiết kỹ thuật'}
            </button>
            
            {showDetails && (
              <div className="auth-error-details">
                <div className="error-detail-section">
                  <strong>Error Message:</strong>
                  <pre>{error.message}</pre>
                </div>
                
                {error.code && (
                  <div className="error-detail-section">
                    <strong>Error Code:</strong>
                    <pre>{error.code}</pre>
                  </div>
                )}
                
                {error.stack && (
                  <div className="error-detail-section">
                    <strong>Stack Trace:</strong>
                    <pre>{error.stack}</pre>
                  </div>
                )}
                
                {errorInfo?.componentStack && (
                  <div className="error-detail-section">
                    <strong>Component Stack:</strong>
                    <pre>{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help text */}
        <div className="auth-error-help">
          <p>Cần hỗ trợ? Liên hệ: <a href="tel:0901234574">090-123-4574</a> hoặc <a href="mailto:support@thctclinic.vn">support@thctclinic.vn</a></p>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorFallback;
