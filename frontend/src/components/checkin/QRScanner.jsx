import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedData, setScannedData] = useState(null); // QR data scanned
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Show confirmation modal
  const [appointmentPreview, setAppointmentPreview] = useState(null); // Appointment info to confirm
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  // Initialize QR scanner with html5-qrcode library
  const startScanner = () => {
    setScanning(true);
    setError('');
    setResult(null);

    // Clear previous scanner if exists
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear();
    }

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success callback - QR code detected
        console.log('QR Code detected:', decodedText);
        setScannedData(decodedText);
        fetchAppointmentInfo(decodedText); // Fetch info first, then show modal
        scanner.clear();
        setScanning(false);
      },
      (errorMessage) => {
        // Error callback - ignore, just scanning
        // console.log('Scanning...', errorMessage);
      }
    );

    html5QrcodeScannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear()
        .then(() => {
          console.log('Scanner stopped');
          setScanning(false);
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err);
          setScanning(false);
        });
    } else {
      setScanning(false);
    }
  };

  // Fetch appointment info before check-in
  const fetchAppointmentInfo = async (qrCode) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      
      // Call a preview endpoint or parse from existing data
      // For now, we'll show the QR code and let user confirm
      // In production, you might want a separate API to preview appointment
      
      setAppointmentPreview({
        qrCode: qrCode,
        message: `Mã QR: ${qrCode}`
      });
      setShowConfirmModal(true);
      setLoading(false);
    } catch (err) {
      setError('Không thể đọc thông tin mã QR');
      setLoading(false);
    }
  };

  // Confirm and proceed with check-in
  const confirmCheckIn = () => {
    if (scannedData) {
      handleCheckIn(scannedData);
      setShowConfirmModal(false);
    }
  };

  // Cancel check-in
  const cancelCheckIn = () => {
    setShowConfirmModal(false);
    setScannedData(null);
    setAppointmentPreview(null);
  };

  const handleManualCheckIn = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setScannedData(manualCode.trim());
      fetchAppointmentInfo(manualCode.trim());
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError('');
    setManualCode('');
    setScannedData(null);
    setAppointmentPreview(null);
  };

  const handleCheckIn = async (qrCode) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        'http://localhost:5000/api/appointments/checkin',
        { qrCode },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setResult({
          success: true,
          message: 'Check-in thành công!',
          appointment: response.data.appointment
        });
        stopScanner();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi check-in. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Check role - Only Receptionist and Admin can scan
  if (!user || (user.role !== 'receptionist' && user.role !== 'admin')) {
    return (
      <div className="qr-scanner-container">
        <div className="access-denied">
          <h2>⛔ Không có quyền truy cập</h2>
          <p>
            {!user && 'Vui lòng đăng nhập để sử dụng chức năng này.'}
            {user && user.role === 'patient' && 'Bệnh nhân vui lòng vào menu "Mã QR của tôi" để hiển thị mã QR cho lễ tân quét.'}
            {user && user.role === 'doctor' && 'Bác sĩ không cần quét QR. Xem danh sách bệnh nhân đã check-in trong Dashboard.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container">
      <div className="scanner-card">
        <div className="scanner-header">
          <h1>📱 Quét Mã QR Check-in</h1>
          <p>
            {user.role === 'receptionist' && 'Quét mã QR của bệnh nhân để check-in'}
            {user.role === 'admin' && 'Quản lý hệ thống check-in - Quét mã QR của bệnh nhân'}
          </p>
        </div>

        {!result ? (
          <>
            {/* Camera Scanner */}
            <div className="scanner-section">
              {!scanning ? (
                <div className="scanner-placeholder">
                  <div className="scanner-icon">📷</div>
                  <p>Nhấn nút bên dưới để bắt đầu quét mã QR</p>
                  <button 
                    className="btn btn-primary"
                    onClick={startScanner}
                  >
                    🎥 Bật Camera Quét QR
                  </button>
                </div>
              ) : (
                <div className="scanner-active">
                  <div id="qr-reader" className="qr-reader-container"></div>
                  <div className="scanner-instructions">
                    <p>📱 Đưa mã QR vào khung quét</p>
                    <p className="scanner-tip">Giữ camera ổn định và đảm bảo đủ ánh sáng</p>
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={stopScanner}
                  >
                    ⏸️ Dừng quét
                  </button>
                </div>
              )}
            </div>

            {/* Manual Input Alternative */}
            <div className="manual-input-section">
              <h3>Hoặc nhập mã thủ công</h3>
              <form onSubmit={handleManualCheckIn}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã lịch hẹn (VD: THCT-1234567890)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    disabled={loading}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || !manualCode.trim()}
                  >
                    {loading ? 'Đang xử lý...' : 'Check-in'}
                  </button>
                </div>
              </form>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </>
        ) : (
          /* Success Result */
          <div className="check-in-result">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Check-in thành công!</h2>
            
            {result.appointment && (
              <div className="appointment-info">
                <div className="info-row">
                  <span className="label">Mã lịch hẹn:</span>
                  <span className="value">{result.appointment.qr_code_token}</span>
                </div>
                <div className="info-row">
                  <span className="label">Bệnh nhân:</span>
                  <span className="value">{result.appointment.patient_name || `ID #${result.appointment.patient_id}`}</span>
                </div>
                <div className="info-row">
                  <span className="label">Bác sĩ:</span>
                  <span className="value">{result.appointment.doctor_name || `Bác sĩ #${result.appointment.doctor_id}`}</span>
                </div>
                <div className="info-row">
                  <span className="label">Khoa:</span>
                  <span className="value">{result.appointment.department_name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Ngày khám:</span>
                  <span className="value">{new Date(result.appointment.appointment_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="info-row">
                  <span className="label">Khung giờ:</span>
                  <span className="value">{result.appointment.time_slot}</span>
                </div>
                <div className="info-row">
                  <span className="label">Trạng thái:</span>
                  <span className="value status-badge">✓ Đã check-in</span>
                </div>
              </div>
            )}

            <div className="result-actions">
              <button 
                className="btn btn-primary"
                onClick={resetScanner}
              >
                Quét tiếp
              </button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="scanner-stats">
          <div className="stat-item">
            <div className="stat-icon">✓</div>
            <div className="stat-text">
              <div className="stat-value">--</div>
              <div className="stat-label">Check-in hôm nay</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">⏱️</div>
            <div className="stat-text">
              <div className="stat-value">--</div>
              <div className="stat-label">Đang chờ khám</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && appointmentPreview && (
        <div className="modal-overlay" onClick={cancelCheckIn}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔍 Xác Nhận Check-in</h2>
              <button className="modal-close" onClick={cancelCheckIn}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="scanned-info">
                <div className="info-icon">📱</div>
                <h3>Mã QR đã quét:</h3>
                <div className="qr-code-display">
                  <code>{appointmentPreview.qrCode}</code>
                </div>
              </div>

              <div className="confirmation-message">
                <p>
                  <strong>Bạn có chắc chắn muốn check-in cho lịch hẹn này?</strong>
                </p>
                <p className="warning-text">
                  ⚠️ Sau khi check-in, trạng thái sẽ được cập nhật và không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={cancelCheckIn}
              >
                ❌ Hủy bỏ
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmCheckIn}
                disabled={loading}
              >
                {loading ? '⏳ Đang xử lý...' : '✅ Xác nhận Check-in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
