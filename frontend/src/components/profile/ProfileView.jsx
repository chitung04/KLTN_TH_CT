import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

/**
 * ProfileView Component - Display user profile information
 * 
 * Features:
 * - Read-only display of user information
 * - Role-based information display
 * - Responsive design
 * - Vietnamese language support
 * - Accessibility compliance with ARIA labels
 * - Loading states and error handling
 * 
 * Requirements: 9.1 - Profile information display
 */
const ProfileView = ({ onEditClick, onChangePasswordClick }) => {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refresh profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user && refreshProfile) {
        try {
          setLoading(true);
          setError(null);
          await refreshProfile();
        } catch (err) {
          setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.');
          console.error('Profile refresh failed:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProfile();
  }, [refreshProfile, user?.id]);

  // Format role display in Vietnamese
  const getRoleDisplay = (role) => {
    const roleMap = {
      'patient': 'Bệnh nhân',
      'doctor': 'Bác sĩ',
      'receptionist': 'Lễ tân',
      'admin': 'Quản trị viên'
    };
    return roleMap[role] || role;
  };

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Ngày không hợp lệ';
    }
  };

  // Format datetime display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Chưa có';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Thời gian không hợp lệ';
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Chưa cập nhật';
    
    // Convert from international format (84...) to local format (0...)
    if (phone.startsWith('84')) {
      return '0' + phone.substring(2);
    }
    return phone;
  };

  if (authLoading || loading) {
    return (
      <div className="profile-view-container" role="main" aria-labelledby="profile-heading">
        <div className="profile-card loading">
          <div className="profile-header">
            <div className="skeleton skeleton-avatar"></div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-subtitle"></div>
          </div>
          <div className="profile-content">
            <div className="info-section">
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-view-container" role="main" aria-labelledby="profile-heading">
        <div className="profile-card error">
          <div className="error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" className="error-icon">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Lỗi tải hồ sơ</h3>
            <p>{error}</p>
            <button 
              className="btn-secondary"
              onClick={() => window.location.reload()}
              aria-label="Tải lại trang"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-view-container" role="main" aria-labelledby="profile-heading">
        <div className="profile-card error">
          <div className="error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" className="error-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3>Chưa đăng nhập</h3>
            <p>Vui lòng đăng nhập để xem thông tin hồ sơ.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-view-container" role="main" aria-labelledby="profile-heading">
      <div className="profile-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar" role="img" aria-label={`Ảnh đại diện của ${user.fullName}`}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="avatar-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          
          <div className="profile-info">
            <h1 id="profile-heading" className="profile-name">
              {user.fullName}
            </h1>
            <div className="profile-role">
              <span className={`role-badge role-${user.role}`}>
                {getRoleDisplay(user.role)}
              </span>
            </div>
            {user.emailVerified && (
              <div className="verification-badge" title="Email đã được xác minh">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="m9 12 2 2 4-4"/>
                  <path d="M21 12c-1.5 0-3-1-3-3s1.5-3 3-3 3 1 3 3-1.5 3-3 3"/>
                  <path d="M3 12c1.5 0 3-1 3-3s-1.5-3-3-3-3 1-3 3 1.5 3 3 3"/>
                </svg>
                <span>Đã xác minh</span>
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button 
              className="btn-primary"
              onClick={onEditClick}
              aria-label="Chỉnh sửa thông tin cá nhân"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Chỉnh sửa
            </button>
            
            <button 
              className="btn-secondary"
              onClick={onChangePasswordClick}
              aria-label="Đổi mật khẩu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Đổi mật khẩu
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Personal Information Section */}
          <section className="info-section" aria-labelledby="personal-info-heading">
            <h2 id="personal-info-heading" className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Thông tin cá nhân
            </h2>
            
            <div className="info-grid">
              <div className="info-item">
                <label className="info-label">Họ và tên</label>
                <div className="info-value">{user.fullName}</div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Email</label>
                <div className="info-value email-value">
                  <span>{user.email}</span>
                  {user.emailVerified ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" title="Đã xác minh">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f56565" strokeWidth="2" title="Chưa xác minh">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Số điện thoại</label>
                <div className="info-value">{formatPhoneNumber(user.phone)}</div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Ngày sinh</label>
                <div className="info-value">{formatDate(user.dateOfBirth)}</div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Vai trò</label>
                <div className="info-value">
                  <span className={`role-badge role-${user.role}`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Account Information Section */}
          <section className="info-section" aria-labelledby="account-info-heading">
            <h2 id="account-info-heading" className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1.5 0-3-1-3-3s1.5-3 3-3 3 1 3 3-1.5 3-3 3"/>
                <path d="M3 12c1.5 0 3-1 3-3s-1.5-3-3-3-3 1-3 3 1.5 3 3 3"/>
              </svg>
              Thông tin tài khoản
            </h2>
            
            <div className="info-grid">
              <div className="info-item">
                <label className="info-label">ID người dùng</label>
                <div className="info-value">#{user.id}</div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Ngày đăng ký</label>
                <div className="info-value">{formatDateTime(user.createdAt)}</div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Đăng nhập lần cuối</label>
                <div className="info-value">{formatDateTime(user.lastLogin)}</div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Cập nhật lần cuối</label>
                <div className="info-value">{formatDateTime(user.updatedAt)}</div>
              </div>
              
              <div className="info-item">
                <label className="info-label">Trạng thái email</label>
                <div className="info-value">
                  <span className={`status-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                    {user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Security Notice */}
          {!user.emailVerified && (
            <section className="info-section security-notice" role="alert" aria-labelledby="security-notice-heading">
              <h2 id="security-notice-heading" className="section-title warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f56565" strokeWidth="2" className="section-icon">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Lưu ý bảo mật
              </h2>
              
              <div className="security-content">
                <p>
                  Email của bạn chưa được xác minh. Để đảm bảo tính bảo mật của tài khoản, 
                  vui lòng kiểm tra hộp thư và xác minh địa chỉ email.
                </p>
                <button className="btn-warning">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Gửi lại email xác minh
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;