import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import './QRCodeDisplay.css';

/**
 * QRCodeDisplay Component - Display appointment QR code
 */
const QRCodeDisplay = ({ appointment, onDownload }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (appointment && appointment.qr_code_token && canvasRef.current) {
      // Generate QR code
      QRCode.toCanvas(
        canvasRef.current,
        appointment.qr_code_token,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [appointment]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `appointment-qr-${appointment.id}.png`;
      link.href = url;
      link.click();
      
      if (onDownload) onDownload();
    }
  };

  if (!appointment) return null;

  return (
    <div className="qr-display-container">
      <div className="qr-card">
        <div className="qr-header">
          <h3>🎫 Mã QR của bạn</h3>
          <p>Vui lòng lưu lại để check-in khi đến phòng khám</p>
        </div>

        <div className="qr-code-wrapper">
          <canvas ref={canvasRef} />
        </div>

        <div className="appointment-info">
          <div className="info-row">
            <span className="label">Mã lịch hẹn:</span>
            <strong>#{appointment.id}</strong>
          </div>
          <div className="info-row">
            <span className="label">Ngày khám:</span>
            <strong>
              {new Date(appointment.appointment_date).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </strong>
          </div>
          <div className="info-row">
            <span className="label">Giờ khám:</span>
            <strong>{appointment.time_slot}</strong>
          </div>
          {appointment.status && (
            <div className="info-row">
              <span className="label">Trạng thái:</span>
              <span className={`status-badge ${appointment.status}`}>
                {appointment.status === 'booked' && '✓ Đã đặt'}
                {appointment.status === 'checked_in' && '✓ Đã check-in'}
                {appointment.status === 'completed' && '✓ Hoàn thành'}
                {appointment.status === 'cancelled' && '✕ Đã hủy'}
              </span>
            </div>
          )}
        </div>

        <button className="btn-download" onClick={handleDownload}>
          ⬇️ Tải QR Code
        </button>

        <div className="qr-note">
          <span className="note-icon">💡</span>
          <p>
            <strong>Lưu ý:</strong> Vui lòng mang theo mã QR này khi đến phòng khám. 
            Lễ tân sẽ quét mã để check-in nhanh chóng.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
