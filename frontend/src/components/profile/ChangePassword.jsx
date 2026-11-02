import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

/**
 * ChangePassword Component - Secure password change with old password verification
 * 
 * Features:
 * - Old password verification for security
 * - New password strength validation
 * - Real-time password strength indicator
 * - Password confirmation matching
 * - Vietnamese language support
 * - Responsive design consistent with existing auth components
 * - Accessibility compliance with ARIA labels
 * - Loading states and success feedback
 * - Show/hide password functionality
 * 
 * Requirements: 5.5 - Password change with old password verification
 */
const ChangePassword = ({ onSuccess, onCancel }) => {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [validationTouched, setValidationTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: [] };
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Ít nhất 8 ký tự');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Ít nhất 1 chữ hoa');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Ít nhất 1 chữ thường');
    
    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push('Ít nhất 1 số');
    
    // Special character bonus
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) score += 1;
    
    return { score, feedback };
  };

  // Validate individual fields
  const validateField = (name, value) => {
    switch (name) {
      case 'currentPassword':
        if (!value) return 'Mật khẩu hiện tại là bắt buộc';
        return '';

      case 'newPassword':
        if (!value) return 'Mật khẩu mới là bắt buộc';
        if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
        if (value.length > 128) return 'Mật khẩu không được vượt quá 128 ký tự';
        if (!/(?=.*[a-z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
        if (!/(?=.*[A-Z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
        if (!/(?=.*\d)/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 số';
        if (formData.currentPassword && value === formData.currentPassword) {
          return 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }
        return '';

      case 'confirmPassword':
        if (!value) return 'Xác nhận mật khẩu là bắt buộc';
        if (value !== formData.newPassword) return 'Mật khẩu không khớp';
        return '';

      default:
        return '';
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Calculate password strength for new password
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
      
      // Also revalidate confirm password if it's filled
      if (formData.confirmPassword && validationTouched.confirmPassword) {
        const confirmError = value !== formData.confirmPassword ? 'Mật khẩu không khớp' : '';
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    }
    
    // Handle confirm password changes
    if (name === 'confirmPassword' && validationTouched.confirmPassword) {
      const confirmError = value !== formData.newPassword ? 'Mật khẩu không khớp' : '';
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
    
    // Real-time validation for touched fields
    if (validationTouched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    
    // Clear success message when user starts editing
    if (success) {
      setSuccess(false);
    }
  };

  // Handle field blur events
  const handleBlur = (e) => {
    const { name } = e.target;
    setValidationTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      
      if (response.success) {
        setSuccess(true);
        
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setValidationTouched({});
        setPasswordStrength({ score: 0, feedback: [] });
        
        // Call onSuccess callback after showing success message
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Password change failed:', error);
      
      // Handle specific error types
      if (error.code === 'INVALID_CURRENT_PASSWORD') {
        setErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' });
      } else if (error.code === 'WEAK_PASSWORD') {
        setErrors({ newPassword: 'Mật khẩu mới không đủ mạnh' });
      } else if (error.code === 'SAME_PASSWORD') {
        setErrors({ newPassword: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
      } else {
        setErrors({ 
          general: error.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    const hasInput = Object.values(formData).some(value => value.length > 0);
    
    if (hasInput) {
      const shouldDiscard = window.confirm(
        'Bạn có muốn hủy bỏ việc đổi mật khẩu không?'
      );
      if (!shouldDiscard) return;
    }
    
    // Reset form
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setValidationTouched({});
    setPasswordStrength({ score: 0, feedback: [] });
    setSuccess(false);
    
    if (onCancel) onCancel();
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return '#e53e3e';
    if (passwordStrength.score <= 2) return '#dd6b20';
    if (passwordStrength.score <= 3) return '#d69e2e';
    if (passwordStrength.score <= 4) return '#38a169';
    return '#00a86b';
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return 'Rất yếu';
    if (passwordStrength.score <= 2) return 'Yếu';
    if (passwordStrength.score <= 3) return 'Trung bình';
    if (passwordStrength.score <= 4) return 'Mạnh';
    return 'Rất mạnh';
  };

  return (
    <div className="change-password-container" role="main" aria-labelledby="change-password-heading">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1 id="change-password-heading" className="change-password-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="lock-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Đổi mật khẩu
          </h1>
          <p className="change-password-subtitle">
            Để bảo mật tài khoản, vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
          </p>
        </div>

        {success && (
          <div className="success-alert" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới từ lần đăng nhập tiếp theo.
          </div>
        )}

        {errors.general && (
          <div className="error-alert" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {errors.general}
          </div>
        )}

        <form className="change-password-form" onSubmit={handleSubmit} noValidate>
          {/* Current Password Field */}
          <div className="form-group">
            <label htmlFor="currentPassword">Mật khẩu hiện tại *</label>
            <div className="input-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.currentPassword ? 'error' : (validationTouched.currentPassword && !errors.currentPassword ? 'valid' : '')}
                placeholder="Nhập mật khẩu hiện tại"
                disabled={loading}
                autoComplete="current-password"
                required
                aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
                aria-invalid={!!errors.currentPassword}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={showPasswords.current ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPasswords.current ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {errors.currentPassword && <span className="error-text" id="currentPassword-error" role="alert">{errors.currentPassword}</span>}
          </div>

          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới *</label>
            <div className="input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.newPassword ? 'error' : (validationTouched.newPassword && !errors.newPassword ? 'valid' : '')}
                placeholder="Nhập mật khẩu mới"
                disabled={loading}
                autoComplete="new-password"
                required
                aria-describedby={errors.newPassword ? 'newPassword-error' : 'password-strength'}
                aria-invalid={!!errors.newPassword}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={showPasswords.new ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPasswords.new ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {errors.newPassword && <span className="error-text" id="newPassword-error" role="alert">{errors.newPassword}</span>}
            
            {/* Password strength indicator */}
            {formData.newPassword && (
              <div className="password-strength" id="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-progress" 
                    style={{ 
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  />
                </div>
                <div className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                  Độ mạnh: {getPasswordStrengthText()}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="strength-feedback">
                    <span>Cần cải thiện: {passwordStrength.feedback.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</label>
            <div className="input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.confirmPassword ? 'error' : (validationTouched.confirmPassword && !errors.confirmPassword ? 'valid' : '')}
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
                autoComplete="new-password"
                required
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={showPasswords.confirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPasswords.confirm ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text" id="confirmPassword-error" role="alert">{errors.confirmPassword}</span>}
          </div>

          {/* Security Tips */}
          <div className="security-tips">
            <h3 className="tips-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3182ce" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9,12 2,2 4,-4"/>
              </svg>
              Mẹo tạo mật khẩu mạnh:
            </h3>
            <ul className="tips-list">
              <li>Sử dụng ít nhất 8 ký tự</li>
              <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
              <li>Tránh sử dụng thông tin cá nhân dễ đoán</li>
              <li>Không sử dụng lại mật khẩu cũ hoặc mật khẩu của tài khoản khác</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Hủy bỏ
            </button>

            <button
              type="submit"
              className={`btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading || Object.values(errors).some(error => error) || passwordStrength.score < 3}
              aria-describedby="change-password-status"
            >
              {loading && (
                <span className="loading-spinner" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                  </svg>
                </span>
              )}
              <span id="change-password-status">
                {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;