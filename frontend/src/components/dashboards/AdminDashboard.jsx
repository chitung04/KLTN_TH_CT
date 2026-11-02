import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

/**
 * AdminDashboard Component - Dashboard for admin role
 * 
 * Features:
 * - System overview and statistics
 * - User management
 * - Appointment management
 * - Security monitoring
 * - All system management functions
 * 
 * Requirements Validation:
 * - Requirement 3.4: Admin can access all system management functions
 */
const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();

  const dashboardCards = [
    {
      id: 'user-management',
      title: 'Quản lý người dùng',
      description: 'Quản lý tài khoản và phân quyền',
      icon: '👥',
      color: '#ef4444',
      action: () => onNavigate && onNavigate('user-management')
    },
    {
      id: 'appointment-management',
      title: 'Quản lý lịch hẹn',
      description: 'Xem và quản lý tất cả lịch hẹn',
      icon: '📅',
      color: '#f59e0b',
      action: () => onNavigate && onNavigate('appointment-management')
    },
    {
      id: 'doctor-management',
      title: 'Quản lý bác sĩ',
      description: 'Quản lý thông tin bác sĩ',
      icon: '👨‍⚕️',
      color: '#10b981',
      action: () => onNavigate && onNavigate('doctor-management')
    },
    {
      id: 'department-management',        
      title: 'Quản lý chuyên khoa',
      description: 'Quản lý khoa phòng',
      icon: '🏥',
      color: '#3b82f6',
      action: () => onNavigate && onNavigate('department-management')
    },
    {
      id: 'security-monitoring',
      title: 'Giám sát bảo mật',
      description: 'Theo dõi hoạt động đăng nhập',
      icon: '🔒',
      color: '#8b5cf6',
      action: () => onNavigate && onNavigate('security-monitoring')
    },
    {
      id: 'system-settings',
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình hệ thống',
      icon: '⚙️',
      color: '#6366f1',
      action: () => onNavigate && onNavigate('system-settings')
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Xin chào, {user.fullName}! 👨‍💼</h1>
          <p className="dashboard-subtitle">Bảng điều khiển quản trị hệ thống</p>
        </div>
        <div className="dashboard-user-info">
          <div className="user-avatar admin">{user.fullName.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">Quản trị viên</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="dashboard-breadcrumb">
        <span className="breadcrumb-item" onClick={() => onNavigate && onNavigate('home')}>
          Trang chủ
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item active">Dashboard Quản trị</span>
      </nav>

      {/* Quick Stats - Removed fake statistics */}

      {/* Dashboard Cards */}
      <div className="dashboard-cards">
        {dashboardCards.map((card) => (
          <div
            key={card.id}
            className="dashboard-card"
            onClick={card.action}
            style={{ borderTopColor: card.color }}
          >
            <div className="card-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
              {card.icon}
            </div>
            <h3 className="card-title">{card.title}</h3>
            <p className="card-description">{card.description}</p>
            <button className="card-action" style={{ backgroundColor: card.color }}>
              Xem chi tiết →
            </button>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="dashboard-section">
        <h2 className="section-title">Trạng thái hệ thống</h2>
        <div className="system-status">
          <div className="status-item">
            <div className="status-indicator online"></div>
            <div className="status-label">Backend API</div>
            <div className="status-value">Hoạt động bình thường</div>
          </div>
          <div className="status-item">
            <div className="status-indicator online"></div>
            <div className="status-label">Database</div>
            <div className="status-value">Kết nối tốt</div>
          </div>
          <div className="status-item">
            <div className="status-indicator online"></div>
            <div className="status-label">Authentication</div>
            <div className="status-value">Hoạt động bình thường</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2 className="section-title">Hoạt động gần đây</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">👤</div>
            <div className="activity-content">
              <div className="activity-title">Người dùng mới đăng ký</div>
              <div className="activity-description">user@example.com</div>
              <div className="activity-time">5 phút trước</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <div className="activity-title">Lịch hẹn mới được tạo</div>
              <div className="activity-description">Nguyễn Văn A - BS. Nguyễn Văn Hùng</div>
              <div className="activity-time">15 phút trước</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <div className="activity-title">Lịch hẹn hoàn thành</div>
              <div className="activity-description">Trần Thị B</div>
              <div className="activity-time">1 giờ trước</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
