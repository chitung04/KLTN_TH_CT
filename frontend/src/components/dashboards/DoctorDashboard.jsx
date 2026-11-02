import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckedInPatientsList } from '../medical-records';
import './Dashboard.css';

/**
 * DoctorDashboard Component - Dashboard for doctor role
 * 
 * Features:
 * - View doctor queue
 * - Access assigned patient records
 * - Manage schedule
 * - View appointments
 * - View checked-in patients (Medical Records Integration)
 * 
 * Requirements Validation:
 * - Requirement 3.2: Doctor can access doctor queue and assigned patient records
 * - Medical Records System - Requirements: 1.1, 2.1, 3.1, 4.1, 5.1
 */
const DoctorDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showCheckedInPatients, setShowCheckedInPatients] = useState(false);

  const dashboardCards = [
    {
      id: 'checked-in-patients',
      title: 'Bệnh nhân đã check-in',
      description: 'Xem danh sách bệnh nhân đã check-in hôm nay',
      icon: '✅',
      color: '#10b981',
      action: () => setShowCheckedInPatients(true)
    },
    {
      id: 'doctor-queue',
      title: 'Hàng đợi bệnh nhân',
      description: 'Xem danh sách bệnh nhân chờ khám',
      icon: '👥',
      color: '#0ea5e9',
      action: () => onNavigate && onNavigate('doctor-queue')
    },
    {
      id: 'save-medical-record',
      title: 'Lưu hồ sơ bệnh án',
      description: 'Ghi chép hồ sơ khám bệnh cho bệnh nhân',
      icon: '📝',
      color: '#ef4444',
      action: () => onNavigate && onNavigate('save-medical-record')
    },
    {
      id: 'schedule',
      title: 'Lịch làm việc',
      description: 'Quản lý lịch khám bệnh',
      icon: '📆',
      color: '#3b82f6',
      action: () => onNavigate && onNavigate('doctor-schedule')
    },
    {
      id: 'patients',
      title: 'Bệnh nhân của tôi',
      description: 'Xem hồ sơ bệnh nhân được phân công',
      icon: '📋',
      color: '#8b5cf6',
      action: () => onNavigate && onNavigate('doctor-patients')
    },
    {
      id: 'profile',
      title: 'Thông tin cá nhân',
      description: 'Cập nhật thông tin tài khoản',
      icon: '👤',
      color: '#f59e0b',
      action: () => onNavigate && onNavigate('profile')
    }
  ];

  // Show checked-in patients view if active
  if (showCheckedInPatients) {
    return (
      <CheckedInPatientsList 
        onBack={() => setShowCheckedInPatients(false)}
        onSelectPatient={(patient) => {
          // Navigate to create medical record form for selected patient
          onNavigate && onNavigate('create-medical-record', { patient });
        }}
      />
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Xin chào, BS. {user.fullName}! 👨‍⚕️</h1>
          <p className="dashboard-subtitle">Chúc bác sĩ một ngày làm việc hiệu quả</p>
        </div>
        <div className="dashboard-user-info">
          <div className="user-avatar doctor">{user.fullName.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">BS. {user.fullName}</span>
            <span className="user-role">Bác sĩ</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="dashboard-breadcrumb">
        <span className="breadcrumb-item" onClick={() => onNavigate && onNavigate('home')}>
          Trang chủ
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item active">Dashboard Bác sĩ</span>
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

      {/* Today's Schedule */}
      <div className="dashboard-section">
        <h2 className="section-title">Lịch khám hôm nay</h2>
        <div className="schedule-list">
          <div className="schedule-item">
            <div className="schedule-time">08:00 - 08:30</div>
            <div className="schedule-content">
              <div className="schedule-patient">Nguyễn Văn A</div>
              <div className="schedule-status waiting">Đang chờ</div>
            </div>
          </div>
          <div className="schedule-item">
            <div className="schedule-time">08:30 - 09:00</div>
            <div className="schedule-content">
              <div className="schedule-patient">Trần Thị B</div>
              <div className="schedule-status waiting">Đang chờ</div>
            </div>
          </div>
          <div className="schedule-item">
            <div className="schedule-time">09:00 - 09:30</div>
            <div className="schedule-content">
              <div className="schedule-patient">Lê Văn C</div>
              <div className="schedule-status completed">Đã khám</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
