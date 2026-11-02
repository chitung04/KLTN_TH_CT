import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

/**
 * ProfileEdit Component - Editable form for user profile information
 * 
 * Features:
 * - Editable form with validation matching RegisterForm style
 * - Real-time validation and error handling
 * - Form validation for email uniqueness and phone format
 * - Vietnamese language support
 * - Responsive design consistent with existing auth components
 * - Accessibility compliance with ARIA labels
 * - Loading states and success feedback
 * 
 * Requirements: 9.2, 9.3, 9.4 - Profile updates with validation
 */
const ProfileEdit = ({ onSave, onCancel }) => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [validationTouched, setValidationTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize form data from user profile
  useEffect(() => {
    if (user) {
      const userData = {
        fullName: user.fullName || '',
        email: user.email || '',
        phone: formatPhoneForInput(user.phone) || '',
        dateOfBirth: user.dateOfBirth || ''
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [user]);

  // Format phone number for input (convert from 84... to 0...)
  const formatPhoneForInput = (phone) => {
    if (!phone) return '';
    if (phone.startsWith('84')) {
      return '0' + phone.substring(2);
    }
    return phone;
  };

  // Validate individual fields
  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value || value.trim().length === 0) return 'Họ và tên là bắt buộc';
        if (value.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        if (value.length > 100) return 'Họ và tên không được vượt quá 100 ký tự';
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value.trim())) {
          return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
        }
        return '';

      case 'email':
        if (!value || value.trim().length === 0) return 'Email là bắt buộc';
        // Enhanced RFC 5322 compliant email validation
        if (!/^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value)) {
          return 'Định dạng email không hợp lệ';
        }
        if (value.length > 100) return 'Email không được vượt quá 100 ký tự';
        return '';

      case 'phone':
        if (!value || value.trim().length === 0) return 'Số điện thoại là bắt buộc';
        // Vietnamese phone number validation
        const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
        if (!/^(84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])\d{7}$/.test(cleanPhone)) {
          return 'Số điện thoại không đúng định dạng Việt Nam';
        }
        return '';

      case 'dateOfBirth':
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (birthDate > today) return 'Ngày sinh không thể là tương lai';
          if (age < 13) return 'Phải từ 13 tuổi trở lên';
          if (age > 120) return 'Tuổi không được vượt quá 120';
        }
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

  // Check if form has changes
  const hasChanges = () => {
    return Object.keys(formData).some(key => 
      formData[key] !== originalData[key]
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!hasChanges()) {
      setSuccess(true);
      setTimeout(() => {
        if (onSave) onSave();
      }, 1500);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Prepare data for API (only changed fields)
      const changedData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changedData[key] = formData[key].trim();
        }
      });

      const response = await updateProfile(changedData);
      
      if (response.success) {
        setSuccess(true);
        setOriginalData({ ...formData });
        
        // Call onSave callback after showing success message
        setTimeout(() => {
          if (onSave) onSave(response.user);
        }, 1500);
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      
      // Handle specific error types
      if (error.details && typeof error.details === 'object') {
        setErrors(error.details);
      } else if (error.code === 'DUPLICATE_EMAIL') {
        setErrors({ email: 'Email đã được sử dụng bởi tài khoản khác' });
      } else if (error.code === 'DUPLICATE_PHONE') {
        setErrors({ phone: 'Số điện thoại đã được sử dụng bởi tài khoản khác' });
      } else {
        setErrors({ 
          general: error.message || 'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges()) {
      const shouldDiscard = window.confirm(
        'Bạn có thay đổi chưa được lưu. Bạn có muốn bỏ qua các thay đổi này không?'
      );
      if (!shouldDiscard) return;
    }
    
    // Reset form to original data
    setFormData({ ...originalData });
    setErrors({});
    setValidationTouched({});
    setSuccess(false);
    
    if (onCancel) onCancel();
  };

  if (authLoading) {
    return (
      <div className="profile-edit-container">
        <div className="profile-edit-card loading">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit-container" role="main" aria-labelledby="profile-edit-heading">
      <div className="profile-edit-card">
        <div className="profile-edit-header">
          <h1 id="profile-edit-heading" className="edit-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="edit-icon">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Chỉnh sửa thông tin cá nhân
          </h1>
          <p className="edit-subtitle">
            Cập nhật thông tin cá nhân của bạn. Các trường có dấu * là bắt buộc.
          </p>
        </div>

        {success && (
          <div className="success-alert" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Cập nhật thông tin thành công!
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

        <form className="profile-edit-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name Field */}
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

          {/* Email Field */}
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
                placeholder="Nhập địa chỉ email"
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
            {formData.email !== originalData.email && !errors.email && (
              <span className="info-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3182ce" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9,12 2,2 4,-4"/>
                </svg>
                Email thay đổi sẽ cần được xác minh lại
              </span>
            )}
          </div>

          {/* Phone Field */}
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

          {/* Date of Birth Field */}
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
              className={`btn-primary ${loading ? 'loading' : ''} ${!hasChanges() && !errors.general ? 'no-changes' : ''}`}
              disabled={loading || Object.values(errors).some(error => error)}
              aria-describedby="save-status"
            >
              {loading && (
                <span className="loading-spinner" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                  </svg>
                </span>
              )}
              <span id="save-status">
                {loading ? 'Đang cập nhật...' : hasChanges() ? 'Lưu thay đổi' : 'Không có thay đổi'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;