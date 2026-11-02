import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthForms.css';

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const RegisterForm = ({ onSuccess, onSwitchToLogin, adminMode = false, preselectedRole = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    role: preselectedRole || (adminMode ? 'patient' : 'patient'),
    agreeToTerms: false,
    agreeToPrivacy: false
  });
  const [errors, setErrors] = useState({});
  const [validationTouched, setValidationTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const { register, error: authError, clearError } = useAuth();

  // Clear auth errors when user starts typing
  useEffect(() => {
    if (authError) {
      clearError();
    }
  }, [formData, authError, clearError]);

  // Debounced email uniqueness check
  const checkEmailUniqueness = useCallback(
    debounce(async (email) => {
      if (!email || !validateEmailFormat(email)) return;
      
      setEmailCheckLoading(true);
      try {
        // This would be a real API call to check email uniqueness
        // For now, simulate the check
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate some emails as taken
        const takenEmails = ['admin@thctclinic.vn', 'doctor1@thctclinic.vn', 'test@test.com'];
        const isTaken = takenEmails.includes(email.toLowerCase());
        
        setEmailValid(!isTaken);
        if (isTaken) {
          setErrors(prev => ({ ...prev, email: 'Email này đã được sử dụng' }));
        } else if (errors.email === 'Email này đã được sử dụng') {
          setErrors(prev => ({ ...prev, email: '' }));
        }
      } catch (error) {
        console.warn('Email check failed:', error);
      } finally {
        setEmailCheckLoading(false);
      }
    }, 800),
    [errors.email]
  );

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password) => {
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
  }, []);

  const validateEmailFormat = (email) => {
    return /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(email);
  };

  const validateVietnamesePhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return /^(84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])\d{7}$/.test(cleanPhone);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value) return 'Họ và tên là bắt buộc';
        if (value.length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        if (value.length > 100) return 'Họ và tên không được vượt quá 100 ký tự';
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
        return '';
        
      case 'email':
        if (!value) return 'Email là bắt buộc';
        if (!validateEmailFormat(value)) return 'Định dạng email không hợp lệ';
        if (value.length > 100) return 'Email không được vượt quá 100 ký tự';
        return '';
        
      case 'phone':
        if (!value) return 'Số điện thoại là bắt buộc';
        if (!validateVietnamesePhone(value)) return 'Số điện thoại không đúng định dạng Việt Nam';
        return '';
        
      case 'password':
        if (!value) return 'Mật khẩu là bắt buộc';
        if (value.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
        if (value.length > 128) return 'Mật khẩu không được vượt quá 128 ký tự';
        if (!/(?=.*[a-z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
        if (!/(?=.*[A-Z])/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
        if (!/(?=.*\d)/.test(value)) return 'Mật khẩu phải chứa ít nhất 1 số';
        return '';
        
      case 'confirmPassword':
        if (!value) return 'Xác nhận mật khẩu là bắt buộc';
        if (value !== formData.password) return 'Mật khẩu không khớp';
        return '';
        
      case 'dateOfBirth':
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();
          
          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
          }
          
          if (birthDate > today) return 'Ngày sinh không thể là tương lai';
          if (age < 13) return 'Phải từ 13 tuổi trở lên';
          if (age > 120) return 'Tuổi không được vượt quá 120';
        }
        return '';
        
      case 'role':
        const validRoles = ['patient', 'doctor', 'receptionist', 'admin'];
        if (!validRoles.includes(value)) return 'Vai trò không hợp lệ';
        return '';
        
      default:
        return '';
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};
    
    switch (step) {
      case 1:
        // Personal Information
        ['fullName', 'email', 'phone'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) stepErrors[field] = error;
        });
        break;
        
      case 2:
        // Account Security
        ['password', 'confirmPassword'].forEach(field => {
          const error = validateField(field, formData[field]);
          if (error) stepErrors[field] = error;
        });
        
        // Additional role validation for admin mode
        if (adminMode) {
          const roleError = validateField('role', formData.role);
          if (roleError) stepErrors.role = roleError;
        }
        break;
        
      case 3:
        // Terms and Confirmation
        if (!formData.agreeToTerms) {
          stepErrors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
        }
        if (!formData.agreeToPrivacy) {
          stepErrors.agreeToPrivacy = 'Bạn phải đồng ý với chính sách bảo mật';
        }
        break;
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    
    // Real-time validation for non-checkbox fields
    if (validationTouched[name] && type !== 'checkbox') {
      const error = validateField(name, fieldValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    
    // Special handling for email - check uniqueness
    if (name === 'email' && fieldValue && validateEmailFormat(fieldValue)) {
      checkEmailUniqueness(fieldValue);
    }
    
    // Special handling for password - calculate strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(fieldValue));
      
      // Also revalidate confirm password if it's filled
      if (formData.confirmPassword && validationTouched.confirmPassword) {
        const confirmError = fieldValue !== formData.confirmPassword ? 'Mật khẩu không khớp' : '';
        setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    }
    
    // Handle confirm password changes
    if (name === 'confirmPassword' && validationTouched.confirmPassword) {
      const confirmError = fieldValue !== formData.password ? 'Mật khẩu không khớp' : '';
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (['agreeToTerms', 'agreeToPrivacy'].includes(name)) return;

    setValidationTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps
    let allValid = true;
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        allValid = false;
        if (step < currentStep) {
          // Go back to the first step with errors
          setCurrentStep(step);
          break;
        }
      }
    }
    
    if (!allValid) return;
    
    setLoading(true);
    try {
      const { confirmPassword, agreeToTerms, agreeToPrivacy, ...registerData } = formData;
      
      // Clean phone number for API
      registerData.phone = registerData.phone.replace(/[\s\-\(\)\.]/g, '');
      
      await register(registerData);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Registration failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Thông tin cá nhân';
      case 2: return 'Bảo mật tài khoản';
      case 3: return 'Xác nhận và hoàn tất';
      default: return 'Đăng ký';
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return '#e53e3e';
    if (passwordStrength.score <= 2) return '#dd6b20';
    if (passwordStrength.score <= 3) return '#d69e2e';
    if (passwordStrength.score <= 4) return '#38a169';
    return '#00a86b';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return 'Rất yếu';
    if (passwordStrength.score <= 2) return 'Yếu';
    if (passwordStrength.score <= 3) return 'Trung bình';
    if (passwordStrength.score <= 4) return 'Mạnh';
    return 'Rất mạnh';
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit} noValidate role="form" aria-labelledby="register-heading">
        <div className="auth-form-header">
          <div className="clinic-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="clinic-icon" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2"/>
            </svg>
          </div>
          <h2 id="register-heading">Đăng ký THCT Clinic</h2>
          <p>Tạo tài khoản để sử dụng dịch vụ khám chữa bệnh</p>
          
          {/* Progress indicator */}
          <div className="form-progress" aria-label="Tiến trình đăng ký">
            <div className="progress-steps">
              {[1, 2, 3].map(step => (
                <div 
                  key={step}
                  className={`progress-step ${step <= currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                  aria-current={step === currentStep ? 'step' : undefined}
                >
                  <div className="step-number">{step}</div>
                  <div className="step-label">
                    {step === 1 && 'Thông tin'}
                    {step === 2 && 'Bảo mật'}
                    {step === 3 && 'Xác nhận'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <h3 className="step-title">{getStepTitle()}</h3>
        </div>

        {authError && authError.type === 'REGISTRATION_ERROR' && (
          <div className="error-alert" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'text-top' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {authError.message}
          </div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="form-step" role="tabpanel" aria-labelledby="step-1-title">
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.fullName ? 'error' : (validationTouched.fullName && !errors.fullName ? 'valid' : '')}
                  placeholder="Nhập họ và tên đầy đủ"
                  disabled={loading}
                  autoComplete="name"
                  required
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                  aria-invalid={!!errors.fullName}
                />
                <span className="input-icon">
                  {errors.fullName ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  ) : (validationTouched.fullName && !errors.fullName ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ))}
                </span>
              </div>
              {errors.fullName && <span className="error-text" id="fullName-error" role="alert">{errors.fullName}</span>}
            </div>

            <div className="form-row">
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
                    className={errors.email ? 'error' : (validationTouched.email && !errors.email && emailValid ? 'valid' : '')}
                    placeholder="Nhập địa chỉ email"
                    disabled={loading}
                    autoComplete="email"
                    required
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                  />
                  <span className="input-icon">
                    {emailCheckLoading ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" className="loading-spinner">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                      </svg>
                    ) : errors.email ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    ) : (validationTouched.email && !errors.email && emailValid ? (
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
                {emailValid === true && validationTouched.email && !errors.email && (
                  <span className="success-text">Email có thể sử dụng</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.phone ? 'error' : (validationTouched.phone && !errors.phone ? 'valid' : '')}
                    placeholder="Nhập số điện thoại"
                    disabled={loading}
                    autoComplete="tel"
                    required
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    aria-invalid={!!errors.phone}
                  />
                  <span className="input-icon">
                    {errors.phone ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    ) : (validationTouched.phone && !errors.phone ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    ))}
                  </span>
                </div>
                {errors.phone && <span className="error-text" id="phone-error" role="alert">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Ngày sinh</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.dateOfBirth ? 'error' : (validationTouched.dateOfBirth && !errors.dateOfBirth ? 'valid' : '')}
                disabled={loading}
                max={new Date(new Date().getFullYear() - 13, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
                aria-invalid={!!errors.dateOfBirth}
              />
              {errors.dateOfBirth && <span className="error-text" id="dateOfBirth-error" role="alert">{errors.dateOfBirth}</span>}
            </div>
          </div>
        )}

        {/* Step 2: Account Security */}
        {currentStep === 2 && (
          <div className="form-step" role="tabpanel" aria-labelledby="step-2-title">
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
                  autoComplete="new-password"
                  required
                  aria-describedby={errors.password ? 'password-error' : 'password-strength'}
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
              
              {/* Password strength indicator */}
              {formData.password && (
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.confirmPassword ? 'error' : (validationTouched.confirmPassword && !errors.confirmPassword ? 'valid' : '')}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  aria-invalid={!!errors.confirmPassword}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  tabIndex={0}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showConfirmPassword ? (
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

            {/* Role selection for admin mode */}
            {adminMode && (
              <div className="form-group">
                <label htmlFor="role">Vai trò *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.role ? 'error' : ''}
                  disabled={loading}
                  required
                  aria-describedby={errors.role ? 'role-error' : undefined}
                  aria-invalid={!!errors.role}
                >
                  <option value="patient">Bệnh nhân</option>
                  <option value="doctor">Bác sĩ</option>
                  <option value="receptionist">Lễ tân</option>
                  <option value="admin">Quản trị viên</option>
                </select>
                {errors.role && <span className="error-text" id="role-error" role="alert">{errors.role}</span>}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Terms and Confirmation */}
        {currentStep === 3 && (
          <div className="form-step" role="tabpanel" aria-labelledby="step-3-title">
            <div className="confirmation-summary">
              <h4>Xác nhận thông tin đăng ký</h4>
              <div className="summary-item">
                <strong>Họ và tên:</strong> {formData.fullName}
              </div>
              <div className="summary-item">
                <strong>Email:</strong> {formData.email}
              </div>
              <div className="summary-item">
                <strong>Số điện thoại:</strong> {formData.phone}
              </div>
              {formData.dateOfBirth && (
                <div className="summary-item">
                  <strong>Ngày sinh:</strong> {new Date(formData.dateOfBirth).toLocaleDateString('vi-VN')}
                </div>
              )}
              <div className="summary-item">
                <strong>Vai trò:</strong> {
                  formData.role === 'patient' ? 'Bệnh nhân' :
                  formData.role === 'doctor' ? 'Bác sĩ' :
                  formData.role === 'receptionist' ? 'Lễ tân' :
                  formData.role === 'admin' ? 'Quản trị viên' : formData.role
                }
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <span className="checkmark"></span>
                Tôi đồng ý với{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  Điều khoản sử dụng
                </a>{' '}
                của THCT Clinic *
              </label>
              {errors.agreeToTerms && <span className="error-text" role="alert">{errors.agreeToTerms}</span>}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToPrivacy"
                  checked={formData.agreeToPrivacy}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <span className="checkmark"></span>
                Tôi đồng ý với{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  Chính sách bảo mật
                </a>{' '}
                của THCT Clinic *
              </label>
              {errors.agreeToPrivacy && <span className="error-text" role="alert">{errors.agreeToPrivacy}</span>}
            </div>
          </div>
        )}

        {/* Form navigation */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrevStep}
              disabled={loading}
            >
              Quay lại
            </button>
          )}
          
          {currentStep < 3 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNextStep}
              disabled={loading}
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="submit"
              className={`btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading}
              aria-describedby="register-status"
            >
              {loading && (
                <span className="loading-spinner" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                  </svg>
                </span>
              )}
              <span id="register-status">
                {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
              </span>
            </button>
          )}
        </div>

        <div className="auth-form-footer">
          <span className="auth-switch">
            Đã có tài khoản?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
              Đăng nhập ngay
            </a>
          </span>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;