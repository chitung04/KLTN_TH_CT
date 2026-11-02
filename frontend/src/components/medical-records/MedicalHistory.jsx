import React, { useState, useEffect } from 'react';
import { getPatientMedicalHistory } from '../../services/medicalRecordsService';
import './MedicalRecords.css';

/**
 * MedicalHistory Component
 * 
 * Displays list of patient's medical records from getPatientMedicalHistory API
 * Shows appointment date, doctor name, department, symptoms, diagnosis
 * Click record to view details
 * Order by appointment_date DESC
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
const MedicalHistory = ({ onViewDetails }) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPatientMedicalHistory();
      
      // Handle different response formats
      let records = [];
      if (Array.isArray(response)) {
        records = response;
      } else if (response && Array.isArray(response.data)) {
        records = response.data;
      } else if (response && response.medicalRecords && Array.isArray(response.medicalRecords)) {
        records = response.medicalRecords;
      }
      
      setMedicalRecords(records);
    } catch (err) {
      console.error('Error loading medical history:', err);
      setError(err.message || 'Không thể tải hồ sơ y tế. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="medical-records-page">
        <div className="medical-records-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Đang tải hồ sơ y tế...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medical-records-page">
        <div className="medical-records-container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button className="btn btn-primary" onClick={loadMedicalHistory}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (medicalRecords.length === 0) {
    return (
      <div className="medical-records-page">
        <div className="medical-records-container">
          <div className="medical-records-header">
            <h1>📋 Hồ Sơ Y Tế</h1>
            <p>Lịch sử khám bệnh và điều trị của bạn</p>
          </div>
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Chưa có hồ sơ y tế</h3>
            <p>Bạn chưa có lịch sử khám bệnh nào được hoàn thành.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-records-page">
      <div className="medical-records-container">
        <div className="medical-records-header">
          <h1>📋 Hồ Sơ Y Tế</h1>
          <p>Lịch sử khám bệnh và điều trị của bạn</p>
        </div>

        <div className="medical-records-content">
          <div className="records-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">{medicalRecords.length}</div>
                <div className="stat-label">Lượt khám</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <div className="stat-info">
                <div className="stat-value">
                  {new Set(medicalRecords.map(r => r.department_name)).size}
                </div>
                <div className="stat-label">Chuyên khoa</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-info">
                <div className="stat-value">
                  {new Set(medicalRecords.map(r => r.doctor_name)).size}
                </div>
                <div className="stat-label">Bác sĩ</div>
              </div>
            </div>
          </div>

          <div className="records-list">
            <h3 className="section-title">Lịch sử khám bệnh</h3>
            {medicalRecords.map((record) => (
              <div
                key={record.medical_record_id}
                className="medical-record-card"
                onClick={() => onViewDetails && onViewDetails(record.medical_record_id)}
              >
                <div className="record-header">
                  <div className="record-date">
                    <div className="date-icon">📅</div>
                    <div className="date-text">
                      <div className="date-main">{formatDate(record.appointment_date)}</div>
                      <div className="date-sub">
                        {new Date(record.appointment_date).toLocaleDateString('vi-VN', {
                          weekday: 'long'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="record-status completed">
                    ✓ Đã khám
                  </div>
                </div>

                <div className="record-body">
                  <div className="record-info-row">
                    <div className="info-label">👨‍⚕️ Bác sĩ:</div>
                    <div className="info-value">{record.doctor_name}</div>
                  </div>
                  <div className="record-info-row">
                    <div className="info-label">🏥 Chuyên khoa:</div>
                    <div className="info-value">{record.department_name}</div>
                  </div>
                  <div className="record-info-row">
                    <div className="info-label">🩺 Triệu chứng:</div>
                    <div className="info-value">{record.symptoms}</div>
                  </div>
                  <div className="record-info-row">
                    <div className="info-label">📝 Chẩn đoán:</div>
                    <div className="info-value diagnosis">{record.diagnosis}</div>
                  </div>
                  {record.note && (
                    <div className="record-info-row">
                      <div className="info-label">💬 Ghi chú:</div>
                      <div className="info-value">{record.note}</div>
                    </div>
                  )}
                  {record.reexamination_date && (
                    <div className="record-info-row reexam">
                      <div className="info-label">🔄 Tái khám:</div>
                      <div className="info-value">
                        {formatDate(record.reexamination_date)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="record-footer">
                  <button className="view-details-btn">
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
