import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import QRCode from 'qrcode';
import './MyQRCode.css';

const MyQRCode = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    if (user) {
      loadMyAppointments();
    }
  }, [user]);

  // Generate QR code when appointment is selected
  useEffect(() => {
    if (selectedAppointment && selectedAppointment.qr_code_token) {
      generateQRCode(selectedAppointment.qr_code_token);
    }
  }, [selectedAppointment]);

  const generateQRCode = async (token) => {
    try {
      const dataUrl = await QRCode.toDataURL(token, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Không thể tạo mã QR');
    }
  };

  const loadMyAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `http://localhost:5000/api/appointments/patient/${user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Chỉ lấy lịch hẹn đã đặt (booked) - chưa check-in
        const bookedAppointments = response.data.appointments.filter(
          apt => apt.status === 'booked'
        );
        setAppointments(bookedAppointments);
      }
    } catch (err) {
      setError('Không thể tải danh sách lịch hẹn');
      console.error('Load appointments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'booked': { label: 'Đã đặt', class: 'status-booked' },
      'checked_in': { label: 'Đã check-in', class: 'status-checked-in' },
      'completed': { label: 'Hoàn thành', class: 'status-completed' },
      'cancelled': { label: 'Đã hủy', class: 'status-cancelled' }
    };
    const info = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${info.class}`}>{info.label}</span>;
  };

  // Generate QR Code URL (using qrcode library from booking)
  const generateQRDataUrl = (qrToken) => {
    // This assumes QR was generated during booking
    // In real app, regenerate or fetch from backend
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  };

  if (!user || user.role !== 'patient') {
    return (
      <div className="my-qr-container">
        <div className="access-denied">
          <h2>⛔ Không có quyền truy cập</h2>
          <p>Chức năng này chỉ dành cho bệnh nhân.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-qr-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-qr-container">
      <div className="my-qr-card">
        <div className="qr-header">
          <h1>📱 Mã QR Của Tôi</h1>
          <p>Xuất trình mã QR này cho lễ tân khi đến khám</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <div className="empty-icon">📅</div>
            <h3>Chưa có lịch hẹn</h3>
            <p>Bạn chưa có lịch hẹn nào đang chờ check-in.</p>
            <p>Vui lòng đặt lịch khám trước khi đến phòng khám.</p>
          </div>
        ) : (
          <>
            {!selectedAppointment ? (
              <div className="appointments-list">
                <h3>Chọn lịch hẹn để hiển thị mã QR:</h3>
                <div className="appointments-grid">
                  {appointments.map((apt) => (
                    <div 
                      key={apt.id}
                      className="appointment-card"
                      onClick={() => setSelectedAppointment(apt)}
                    >
                      <div className="apt-header">
                        <span className="apt-id">#{apt.id}</span>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="apt-info">
                        <div className="info-row">
                          <span className="icon">👨‍⚕️</span>
                          <span>{apt.doctor_name}</span>
                        </div>
                        <div className="info-row">
                          <span className="icon">🏥</span>
                          <span>{apt.department_name}</span>
                        </div>
                        <div className="info-row">
                          <span className="icon">📅</span>
                          <span>{formatDate(apt.appointment_date)}</span>
                        </div>
                        <div className="info-row">
                          <span className="icon">⏰</span>
                          <span>{apt.time_slot}</span>
                        </div>
                      </div>
                      <button className="btn-view-qr">
                        Xem mã QR →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="qr-display">
                <button 
                  className="btn-back"
                  onClick={() => setSelectedAppointment(null)}
                >
                  ← Quay lại
                </button>

                <div className="qr-showcase">
                  <div className="qr-code-large">
                    {/* Display Real QR Code Image */}
                    <div className="qr-token-display">
                      {qrCodeDataUrl ? (
                        <div className="qr-visual">
                          <img 
                            src={qrCodeDataUrl} 
                            alt="QR Check-in Code" 
                            className="qr-image"
                          />
                        </div>
                      ) : (
                        <div className="qr-visual">
                          <div className="qr-loading">
                            <div className="spinner"></div>
                            <p>Đang tạo mã QR...</p>
                          </div>
                        </div>
                      )}
                      <p className="qr-token-text">{selectedAppointment.qr_code_token}</p>
                    </div>
                  </div>

                  <div className="appointment-details">
                    <h3>Thông tin lịch khám</h3>
                    <div className="detail-row">
                      <span className="label">Mã lịch hẹn:</span>
                      <span className="value">#{selectedAppointment.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Bác sĩ:</span>
                      <span className="value">{selectedAppointment.doctor_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Khoa:</span>
                      <span className="value">{selectedAppointment.department_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Ngày khám:</span>
                      <span className="value">{formatDate(selectedAppointment.appointment_date)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Khung giờ:</span>
                      <span className="value">{selectedAppointment.time_slot}</span>
                    </div>
                  </div>
                </div>

                <div className="qr-instructions-box">
                  <h4>📋 Hướng dẫn sử dụng:</h4>
                  <ol>
                    <li>Đến phòng khám trước giờ hẹn <strong>15 phút</strong></li>
                    <li>Xuất trình màn hình này cho <strong>lễ tân</strong></li>
                    <li>Lễ tân sẽ quét mã QR để check-in cho bạn</li>
                    <li>Chờ gọi tên để vào khám</li>
                  </ol>
                  <div className="tip-box">
                    <strong>💡 Mẹo:</strong> Tăng độ sáng màn hình để dễ quét hơn
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyQRCode;
