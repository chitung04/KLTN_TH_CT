import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './QueueTracking.css';

/**
 * QueueTracking Component
 * Real-time queue position tracking for patients
 * 
 * Requirements: Real-time Queue Tracking (Requirement 12 extension)
 */
const QueueTracking = ({ appointmentId, onClose }) => {
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchQueuePosition = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:5000/api/queue/my-position/${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setQueueInfo(response.data.data);
      }
    } catch (err) {
      console.error('Get queue position error:', err);
      setError(err.response?.data?.error?.message || 'Lỗi khi lấy thông tin hàng đợi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchQueuePosition();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchQueuePosition();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [appointmentId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_queue':
        return '#3b82f6'; // blue
      case 'not_checked_in':
        return '#f59e0b'; // orange
      case 'completed':
        return '#10b981'; // green
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_queue':
        return '⏱️';
      case 'not_checked_in':
        return '⚠️';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading && !queueInfo) {
    return (
      <div className="queue-tracking-container">
        <div className="queue-loading">
          <div className="spinner"></div>
          <p>Đang tải thông tin hàng đợi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-tracking-container">
        <div className="queue-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchQueuePosition}>
            Thử lại
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              Đóng
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!queueInfo) {
    return null;
  }

  // Not checked-in yet
  if (queueInfo.status === 'not_checked_in') {
    return (
      <div className="queue-tracking-container">
        <div className="queue-card" style={{ borderColor: getStatusColor(queueInfo.status) }}>
          <div className="queue-header">
            <div className="queue-icon" style={{ backgroundColor: getStatusColor(queueInfo.status) }}>
              {getStatusIcon(queueInfo.status)}
            </div>
            <h2>Chưa Check-in</h2>
            {onClose && (
              <button className="close-button" onClick={onClose}>✕</button>
            )}
          </div>
          <div className="queue-message">
            <p>{queueInfo.message}</p>
          </div>
          <div className="queue-action">
            <p>📍 Vui lòng đến quầy lễ tân để quét mã QR check-in</p>
          </div>
        </div>
      </div>
    );
  }

  // Completed
  if (queueInfo.status === 'completed') {
    return (
      <div className="queue-tracking-container">
        <div className="queue-card" style={{ borderColor: getStatusColor(queueInfo.status) }}>
          <div className="queue-header">
            <div className="queue-icon" style={{ backgroundColor: getStatusColor(queueInfo.status) }}>
              {getStatusIcon(queueInfo.status)}
            </div>
            <h2>Đã hoàn thành</h2>
            {onClose && (
              <button className="close-button" onClick={onClose}>✕</button>
            )}
          </div>
          <div className="queue-message success">
            <p>{queueInfo.message}</p>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của THCT Clinic!</p>
          </div>
        </div>
      </div>
    );
  }

  // Cancelled
  if (queueInfo.status === 'cancelled') {
    return (
      <div className="queue-tracking-container">
        <div className="queue-card" style={{ borderColor: getStatusColor(queueInfo.status) }}>
          <div className="queue-header">
            <div className="queue-icon" style={{ backgroundColor: getStatusColor(queueInfo.status) }}>
              {getStatusIcon(queueInfo.status)}
            </div>
            <h2>Đã hủy</h2>
            {onClose && (
              <button className="close-button" onClick={onClose}>✕</button>
            )}
          </div>
          <div className="queue-message">
            <p>{queueInfo.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // In queue - show detailed tracking
  if (queueInfo.status === 'in_queue' && queueInfo.queueInfo) {
    const { position, totalWaiting, estimatedWaitMinutes, doctor, appointmentTime } = queueInfo.queueInfo;
    const isNextPatient = position === 1;

    return (
      <div className="queue-tracking-container">
        <div className={`queue-card ${isNextPatient ? 'next-patient' : ''}`} 
             style={{ borderColor: getStatusColor(queueInfo.status) }}>
          
          {/* Header */}
          <div className="queue-header">
            <div className="queue-icon" style={{ backgroundColor: getStatusColor(queueInfo.status) }}>
              {getStatusIcon(queueInfo.status)}
            </div>
            <h2>{isNextPatient ? 'Đến lượt bạn!' : 'Đang chờ khám'}</h2>
            {onClose && (
              <button className="close-button" onClick={onClose}>✕</button>
            )}
          </div>

          {/* Position Display */}
          <div className={`position-display ${isNextPatient ? 'pulse' : ''}`}>
            <div className="position-number">{position}</div>
            <div className="position-label">Số thứ tự của bạn</div>
          </div>

          {/* Queue Info */}
          <div className="queue-info-grid">
            <div className="info-item">
              <div className="info-icon">👥</div>
              <div className="info-content">
                <div className="info-label">Tổng số người chờ</div>
                <div className="info-value">{totalWaiting} người</div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">⏰</div>
              <div className="info-content">
                <div className="info-label">Thời gian dự kiến</div>
                <div className="info-value">
                  {estimatedWaitMinutes === 0 
                    ? 'Ngay bây giờ' 
                    : `${estimatedWaitMinutes} phút`}
                </div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">👨‍⚕️</div>
              <div className="info-content">
                <div className="info-label">Bác sĩ</div>
                <div className="info-value">{doctor.name}</div>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">🏥</div>
              <div className="info-content">
                <div className="info-label">Khoa</div>
                <div className="info-value">{doctor.department}</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="queue-progress">
            <div className="progress-label">
              <span>Tiến độ</span>
              <span>{Math.round(((totalWaiting - position + 1) / totalWaiting) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${((totalWaiting - position + 1) / totalWaiting) * 100}%`,
                  backgroundColor: isNextPatient ? '#10b981' : '#3b82f6'
                }}
              ></div>
            </div>
          </div>

          {/* Message */}
          <div className={`queue-message ${isNextPatient ? 'urgent' : ''}`}>
            {isNextPatient ? (
              <>
                <p className="urgent-text">🔔 Vui lòng chuẩn bị vào phòng khám!</p>
                <p>Bác sĩ đang chờ bạn</p>
              </>
            ) : (
              <p>{queueInfo.message}</p>
            )}
          </div>

          {/* Auto-refresh indicator */}
          <div className="auto-refresh">
            <div className="refresh-icon rotating">🔄</div>
            <span>Tự động cập nhật mỗi 30 giây</span>
          </div>

          {/* Manual refresh button */}
          <button 
            className="btn-refresh" 
            onClick={fetchQueuePosition}
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật ngay'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default QueueTracking;
