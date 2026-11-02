import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './DoctorQueue.css';

/**
 * DoctorQueue Component - Displays patient queue for doctors
 * 
 * Features:
 * - View list of checked-in patients in order
 * - Display patient information and symptoms
 * - Show queue position and estimated wait time
 * - Real-time queue updates
 * 
 * Requirements Validation:
 * - Requirement 7.3: Doctors can view their checked-in patients in queue
 * - Requirement 3.2: Doctor can access doctor queue and assigned patient records
 */
const DoctorQueue = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch doctor ID from user info
  const fetchDoctorQueue = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      
      // First, get doctor_id from user
      const doctorResponse = await axios.get(
        `http://localhost:5000/api/users/doctor-info`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!doctorResponse.data.success || !doctorResponse.data.doctorId) {
        throw new Error('Không tìm thấy thông tin bác sĩ');
      }

      const doctorId = doctorResponse.data.doctorId;

      // Fetch queue using queue controller endpoint
      const queueResponse = await axios.get(
        `http://localhost:5000/api/queue/doctor/${doctorId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (queueResponse.data.success) {
        setQueue(queueResponse.data.queue || []);
        setDoctorInfo(queueResponse.data.doctor);
      }
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
      setError(err.response?.data?.error?.message || 'Không thể tải hàng đợi bệnh nhân. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh queue
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDoctorQueue();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchDoctorQueue();
    }
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDoctorQueue();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Check role - Only Doctor and Admin can access
  if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
    return (
      <div className="doctor-queue-container">
        <div className="access-denied">
          <h2>⛔ Không có quyền truy cập</h2>
          <p>Chỉ bác sĩ mới có thể xem hàng đợi bệnh nhân.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="doctor-queue-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải hàng đợi bệnh nhân...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-queue-container">
      {/* Header */}
      <div className="queue-header">
        <div className="header-content">
          <h1>👥 Hàng đợi bệnh nhân</h1>
          {doctorInfo && (
            <div className="doctor-info">
              <p className="doctor-name">{doctorInfo.degree} {doctorInfo.name}</p>
              <p className="doctor-department">{doctorInfo.department}</p>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            className={`btn-refresh ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            🔄 {refreshing ? 'Đang cập nhật...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={fetchDoctorQueue} className="btn-retry">
            Thử lại
          </button>
        </div>
      )}

      {/* Queue Stats */}
      <div className="queue-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{queue.length}</div>
            <div className="stat-label">Bệnh nhân đang chờ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{queue.length * 15} phút</div>
            <div className="stat-label">Thời gian chờ ước tính</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{new Date().toLocaleDateString('vi-VN')}</div>
            <div className="stat-label">Ngày hôm nay</div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="empty-queue">
          <div className="empty-icon">✓</div>
          <h3>Không có bệnh nhân trong hàng đợi</h3>
          <p>Hiện tại không có bệnh nhân nào đã check-in và đang chờ khám.</p>
        </div>
      ) : (
        <div className="queue-list">
          <div className="list-header">
            <h2>Danh sách bệnh nhân đang chờ</h2>
            <p className="list-subtitle">Danh sách được sắp xếp theo thứ tự check-in</p>
          </div>
          
          {queue.map((patient, index) => (
            <div 
              key={patient.appointment_id} 
              className={`queue-item ${index === 0 ? 'next-patient' : ''}`}
            >
              <div className="queue-position">
                <div className="position-badge">
                  {index === 0 ? '👉' : patient.queue_position}
                </div>
                {index === 0 && <span className="next-label">Tiếp theo</span>}
              </div>

              <div className="patient-info">
                <div className="patient-header">
                  <h3 className="patient-name">{patient.patient_name}</h3>
                  <span className="appointment-time">{patient.time_slot}</span>
                </div>
                
                <div className="patient-details">
                  <div className="detail-row">
                    <span className="detail-icon">📱</span>
                    <span className="detail-text">{patient.patient_phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">📧</span>
                    <span className="detail-text">{patient.patient_email}</span>
                  </div>
                  {patient.symptoms && (
                    <div className="detail-row symptoms">
                      <span className="detail-icon">📋</span>
                      <span className="detail-text">
                        <strong>Triệu chứng:</strong> {patient.symptoms}
                      </span>
                    </div>
                  )}
                </div>

                <div className="patient-meta">
                  <span className="checkin-time">
                    ✓ Check-in: {new Date(patient.checked_in_time).toLocaleTimeString('vi-VN')}
                  </span>
                  <span className="wait-time">
                    ⏱️ Chờ khoảng: {(index * 15)} phút
                  </span>
                </div>
              </div>

              <div className="queue-actions">
                <button 
                  className="btn-view-record"
                  onClick={() => window.location.href = `/save-medical-record?appointmentId=${patient.appointment_id}`}
                >
                  📝 Khám bệnh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-refresh notice */}
      <div className="auto-refresh-notice">
        <span>🔄 Tự động cập nhật mỗi 30 giây</span>
      </div>
    </div>
  );
};

export default DoctorQueue;
