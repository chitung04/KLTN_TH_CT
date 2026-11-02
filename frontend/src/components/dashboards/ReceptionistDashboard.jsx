import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

/**
 * ReceptionistDashboard Component - Dashboard for receptionist role
 * 
 * Features:
 * - QR check-in for patients
 * - Appointment management
 * - Patient registration
 * - Patient medical records lookup (Medical Records Integration)
 * - Today's schedule overview
 * 
 * Requirements Validation:
 * - Requirement 3.3: Receptionist can access check-in QR and appointment management
 * - Medical Records System - Requirements: 9.1, 9.2, 9.3, 9.4
 */
const ReceptionistDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Search for patient medical records
  const handleSearchPatient = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = localStorage.getItem('auth_token');
      // Search for users/patients first
      const response = await axios.get(`${API_BASE}/users/search`, {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.users || []);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      alert('Không thể tìm kiếm bệnh nhân. Vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
  };

  // View patient medical records
  const handleViewPatientRecords = async (patientId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/medical-records/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Navigate to patient records view with data
        onNavigate && onNavigate('patient-medical-records', { 
          patientId, 
          records: response.data.records 
        });
      }
    } catch (err) {
      console.error('Error fetching patient records:', err);
      alert('Không thể tải hồ sơ bệnh nhân. Vui lòng thử lại.');
    }
  };

  const dashboardCards = [
    {
      id: 'qr-checkin',
      title: 'QR Check-in',
      description: 'Quét mã QR check-in bệnh nhân',
      icon: '📱',
      color: '#f59e0b',
      action: () => onNavigate && onNavigate('qr-checkin')
    },
    {
      id: 'appointment-management',
      title: 'Quản lý lịch hẹn',
      description: 'Xem và quản lý các lịch hẹn',
      icon: '📅',
      color: '#3b82f6',
      action: () => onNavigate && onNavigate('appointment-management')
    },
    {
      id: 'patient-records-lookup',
      title: 'Tra cứu hồ sơ bệnh nhân',
      description: 'Tìm kiếm và xem hồ sơ y tế bệnh nhân',
      icon: '🔍',
      color: '#ec4899',
      action: () => setShowSearchResults(true)
    },
    {
      id: 'patient-registration',
      title: 'Đăng ký bệnh nhân',
      description: 'Đăng ký bệnh nhân mới',
      icon: '➕',
      color: '#10b981',
      action: () => onNavigate && onNavigate('patient-registration')
    },
    {
      id: 'profile',
      title: 'Thông tin cá nhân',
      description: 'Cập nhật thông tin tài khoản',
      icon: '👤',
      color: '#8b5cf6',
      action: () => onNavigate && onNavigate('profile')
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Xin chào, {user.fullName}! 💼</h1>
          <p className="dashboard-subtitle">Chúc bạn một ngày làm việc vui vẻ</p>
        </div>
        <div className="dashboard-user-info">
          <div className="user-avatar receptionist">{user.fullName.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">Lễ tân</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="dashboard-breadcrumb">
        <span className="breadcrumb-item" onClick={() => onNavigate && onNavigate('home')}>
          Trang chủ
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item active">Dashboard Lễ tân</span>
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

      {/* Patient Search Section */}
      {showSearchResults && (
        <div className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="section-title">🔍 Tra cứu hồ sơ bệnh nhân</h2>
            <button 
              onClick={() => setShowSearchResults(false)}
              style={{
                padding: '8px 16px',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Đóng
            </button>
          </div>
          
          <form onSubmit={handleSearchPatient} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Nhập tên hoặc số điện thoại bệnh nhân..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  padding: '12px 30px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  opacity: isSearching ? 0.6 : 1
                }}
              >
                {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
            </div>
          </form>

          {searchResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #ec4899',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>
                      {patient.fullName}
                    </h4>
                    <p style={{ margin: '0', fontSize: '14px', color: '#718096' }}>
                      📞 {patient.phone} | 📧 {patient.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewPatientRecords(patient.id)}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Xem hồ sơ →
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
              <p>Không tìm thấy bệnh nhân nào</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Upcoming Check-ins */}
      <div className="dashboard-section">
        <h2 className="section-title">Lịch hẹn sắp tới</h2>
        <div className="checkin-list">
          <div className="checkin-item">
            <div className="checkin-time">08:30</div>
            <div className="checkin-content">
              <div className="checkin-patient">Nguyễn Thị D</div>
              <div className="checkin-doctor">BS. Nguyễn Văn Hùng</div>
            </div>
            <div className="checkin-status pending">Chưa check-in</div>
          </div>
          <div className="checkin-item">
            <div className="checkin-time">09:00</div>
            <div className="checkin-content">
              <div className="checkin-patient">Trần Văn E</div>
              <div className="checkin-doctor">BS. Trần Thị Mai</div>
            </div>
            <div className="checkin-status pending">Chưa check-in</div>
          </div>
          <div className="checkin-item">
            <div className="checkin-time">09:30</div>
            <div className="checkin-content">
              <div className="checkin-patient">Lê Thị F</div>
              <div className="checkin-doctor">BS. Lê Văn Đức</div>
            </div>
            <div className="checkin-status checked-in">Đã check-in</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
