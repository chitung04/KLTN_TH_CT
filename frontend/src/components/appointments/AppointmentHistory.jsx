import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AppointmentHistory.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const AppointmentHistory = ({ onBack }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/appointments/my-appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAppointments(response.data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ khám', color: '#f59e0b', icon: '⏳' },
      confirmed: { label: 'Đã xác nhận', color: '#3b82f6', icon: '✅' },
      completed: { label: 'Hoàn thành', color: '#10b981', icon: '✓' },
      cancelled: { label: 'Đã hủy', color: '#ef4444', icon: '✕' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className="status-badge" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
        {config.icon} {config.label}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="appointment-history-container">
      <div className="history-header">
        {onBack && (
          <button className="btn-back" onClick={onBack}>← Quay lại</button>
        )}
        <h1>📅 Lịch Sử Đặt Khám</h1>
        <p>Xem lại tất cả lịch hẹn của bạn</p>
      </div>

      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tất cả ({appointments.length})
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          ⏳ Chờ khám ({appointments.filter(a => a.status === 'pending').length})
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          ✓ Hoàn thành ({appointments.filter(a => a.status === 'completed').length})
        </button>
        <button 
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          ✕ Đã hủy ({appointments.filter(a => a.status === 'cancelled').length})
        </button>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Không có lịch hẹn nào</h3>
          <p>Bạn chưa có lịch hẹn {filter !== 'all' ? 'ở trạng thái này' : 'nào'}</p>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <div className="card-header">
                <div className="appointment-date">
                  <span className="date-icon">📅</span>
                  <div>
                    <strong>{new Date(appointment.appointmentDate).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</strong>
                    <p className="time">⏰ {appointment.appointmentTime}</p>
                  </div>
                </div>
                {getStatusBadge(appointment.status)}
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">👨‍⚕️ Bác sĩ:</span>
                  <span className="value">{appointment.doctorName || 'Chưa xác định'}</span>
                </div>
                <div className="info-row">
                  <span className="label">🏥 Chuyên khoa:</span>
                  <span className="value">{appointment.departmentName}</span>
                </div>
                {appointment.symptoms && (
                  <div className="info-row">
                    <span className="label">🤒 Triệu chứng:</span>
                    <span className="value">{appointment.symptoms}</span>
                  </div>
                )}
                {appointment.notes && (
                  <div className="info-row">
                    <span className="label">📝 Ghi chú:</span>
                    <span className="value">{appointment.notes}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <small>Đặt lúc: {new Date(appointment.createdAt).toLocaleString('vi-VN')}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentHistory;
