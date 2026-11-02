import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForms.css';

const LoginForm = ({ onSuccess, onSwitchToRegister, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationTouched, setValidationTouched] = useState({});
  const { login, error: authError, clearError } = useAuth();

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  // Clear auth errors when user starts typing
  useEffect(() => {
    if (authError) {
      clearError();
    }
  }, [formData.email, formData.password, authError, clearError]);

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email là bắt buộc';
        // Enhanced RFC 5322 compliant email validation
        if (!/^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value)) {
          return 'Định dạng email không hợp lệ';
        }
        if (value.length > 100) return 'Email không được vượt quá 100 ký tự';
        return '';
      case 'password':
        if (!value) return 'Mật khẩu là bắt buộc';
        // Enhanced password validation according to spec requirements (min 8 chars, mixed case, numbers)
        if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
        if (!/(?=.*[a-z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
        if (!/(?=.*[A-Z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
        if (!/(?=.*\d)/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 số';
        if (value.length > 128) return 'Mật khẩu không được vượt quá 128 ký tự';
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(field => {
      if (field !== 'rememberMe') {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    // Real-time validation
    if (validationTouched[name] && name !== 'rememberMe') {
      const error = validateField(name, fieldValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (name === 'rememberMe') return;

    setValidationTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await login({
        email: formData.email,
        password: formData.password
      });

      // Handle "Remember me" functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      // Error handling is managed by AuthContext
      console.error('Login failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (onForgotPassword) {
      onForgotPassword(formData.email);
    } else {
      // Enhanced forgot password with better user feedback
      const email = formData.email || prompt('Nhập email để đặt lại mật khẩu:');
      if (email) {
        // For now, show a more informative message
        alert(`Hướng dẫn đặt lại mật khẩu sẽ được gửi đến ${email}. Vui lòng kiểm tra email và thực hiện theo hướng dẫn.`);
      }
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit} noValidate role="form" aria-labelledby="login-heading">
        <div className="auth-form-header">
          <div className="clinic-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="clinic-icon" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2"/>
            </svg>
          </div>
          <h2 id="login-heading">Đăng nhập THCT Clinic</h2>
          <p>Truy cập hệ thống đặt lịch khám bệnh</p>
        </div>

        {authError && authError.type === 'LOGIN_ERROR' && (
          <div className="error-alert" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'text-top' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {authError.message}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.email ? 'error' : (validationTouched.email && !errors.email ? 'valid' : '')}
              placeholder="Nhập email của bạn"
              disabled={loading}
              autoComplete="email"
              required
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
            />
            <span className="input-icon">
              {errors.email ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              ) : (validationTouched.email && !errors.email ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              ))}
            </span>
          </div>
          {errors.email && <span className="error-text" id="email-error" role="alert">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Mật khẩu *</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.password ? 'error' : (validationTouched.password && !errors.password ? 'valid' : '')}
              placeholder="Nhập mật khẩu"
              disabled={loading}
              autoComplete="current-password"
              required
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              tabIndex={0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showPassword ? (
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
          {errors.password && <span className="error-text" id="password-error" role="alert">{errors.password}</span>}
        </div>

        <div className="form-group-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={loading}
            />
            <span className="checkmark"></span>
            Ghi nhớ đăng nhập
          </label>
        </div>

        <button
          type="submit"
          className={`btn-primary ${loading ? 'loading' : ''}`}
          disabled={loading || Object.keys(errors).some(key => errors[key])}
          aria-describedby="login-status"
        >
          {loading && (
            <span className="loading-spinner" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
              </svg>
            </span>
          )}
          <span id="login-status">
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </span>
        </button>

        <div className="auth-form-footer">
          <a href="#" onClick={handleForgotPassword} className="forgot-password-link">
            Quên mật khẩu?
          </a>
          <span className="auth-switch">
            Chưa có tài khoản?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
              Đăng ký ngay
            </a>
          </span>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;