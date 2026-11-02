import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicalHistory } from '../medical-records';
import './Dashboard.css';

/**
 * PatientDashboard Component - Dashboard for patient role
 * 
 * Features:
 * - Quick access to booking appointments
 * - View upcoming appointments
 * - Access medical records (Medical Records Integration)
 * - Profile management
 * 
 * Requirements Validation:
 * - Requirement 3.1: Patient can access booking and their own medical records
 * - Medical Records System - Requirements: 6.1, 7.1, 8.1
 */
const PatientDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);

  const dashboardCards = [
    {
      id: 'booking',
      title: 'Đặt lịch khám',
      description: 'Đặt lịch khám bệnh với bác sĩ',
      icon: '📅',
      color: '#667eea',
      action: () => onNavigate && onNavigate('booking')
    },
    {
      id: 'appointment-history',
      title: 'Lịch sử đặt khám',
      description: 'Xem lịch sử các lần đặt khám',
      icon: '📋',
      color: '#764ba2',
      action: () => onNavigate && onNavigate('appointment-history')
    },
    {
      id: 'medical-records',
      title: 'Hồ sơ y tế',
      description: 'Xem hồ sơ và kết quả khám',
      icon: '📁',
      color: '#f093fb',
      action: () => setShowMedicalHistory(true)
    },
    {
      id: 'profile',
      title: 'Thông tin cá nhân',
      description: 'Cập nhật thông tin tài khoản',
      icon: '👤',
      color: '#4facfe',
      action: () => onNavigate && onNavigate('profile')
    }
  ];

  // Show medical history view if active
  if (showMedicalHistory) {
    return (
      <MedicalHistory 
        onBack={() => setShowMedicalHistory(false)}
        onViewRecord={(recordId) => {
          // Navigate to medical record details
          onNavigate && onNavigate('medical-record-details', { recordId });
        }}
      />
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Xin chào, {user.fullName}! 👋</h1>
          <p className="dashboard-subtitle">Chào mừng bạn đến với THCT Clinic</p>
        </div>
        <div className="dashboard-user-info">
          <div className="user-avatar">{user.fullName.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">Bệnh nhân</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="dashboard-breadcrumb">
        <span className="breadcrumb-item" onClick={() => onNavigate && onNavigate('home')}>
          Trang chủ
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item active">Dashboard Bệnh nhân</span>
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

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2 className="section-title">Hoạt động gần đây</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">📅</div>
            <div className="activity-content">
              <div className="activity-title">Đặt lịch khám</div>
              <div className="activity-time">2 giờ trước</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <div className="activity-title">Hoàn thành khám bệnh</div>
              <div className="activity-time">1 ngày trước</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📁</div>
            <div className="activity-content">
              <div className="activity-title">Xem hồ sơ y tế</div>
              <div className="activity-time">3 ngày trước</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
