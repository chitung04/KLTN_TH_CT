import React, { useState, useEffect } from 'react';
import { getMedicalRecordDetails } from '../../services/medicalRecordsService';
import PrescriptionsList from './PrescriptionsList';
import './MedicalRecords.css';

/**
 * MedicalRecordDetails Component
 * 
 * Display full medical record details from getMedicalRecordDetails API
 * Show appointment info, doctor info, symptoms, diagnosis, note, reexamination_date
 * Display prescriptions list below
 * Back button to return to history
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
const MedicalRecordDetails = ({ medicalRecordId, onBack }) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicalRecordId) {
      loadRecordDetails();
    }
  }, [medicalRecordId]);

  const loadRecordDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMedicalRecordDetails(medicalRecordId);
      setRecord(data);
    } catch (err) {
      console.error('Error loading medical record details:', err);
      setError(err.message || 'Không thể tải chi tiết hồ sơ. Vui lòng thử lại sau.');
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="medical-records-page">
        <div className="medical-records-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Đang tải chi tiết hồ sơ...</p>
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
            <div className="error-actions">
              <button className="btn btn-secondary" onClick={onBack}>
                ← Quay lại
              </button>
              <button className="btn btn-primary" onClick={loadRecordDetails}>
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="medical-records-page">
        <div className="medical-records-container">
          <div className="error-container">
            <div className="error-icon">❌</div>
            <p className="error-text">Không tìm thấy hồ sơ y tế</p>
            <button className="btn btn-secondary" onClick={onBack}>
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-records-page">
      <div className="medical-records-container">
        {/* Header with back button */}
        <div className="details-header">
          <button className="back-button" onClick={onBack}>
            ← Quay lại
          </button>
          <div className="header-content">
            <h1>📋 Chi Tiết Hồ Sơ Y Tế</h1>
            <p>Mã hồ sơ: #{record.medical_record_id}</p>
          </div>
        </div>

        <div className="details-content">
          {/* Appointment Information */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="title-icon">📅</span>
              Thông tin lịch khám
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Ngày khám:</div>
                <div className="info-value">
                  {formatDate(record.appointment_date)}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Giờ khám:</div>
                <div className="info-value">{record.time_slot || 'Không rõ'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Bác sĩ khám:</div>
                <div className="info-value">{record.doctor_name}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Chuyên khoa:</div>
                <div className="info-value">{record.department_name}</div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="title-icon">🩺</span>
              Thông tin y tế
            </h3>
            
            <div className="medical-info-card">
              <div className="medical-info-row">
                <div className="medical-label">Triệu chứng:</div>
                <div className="medical-value">{record.symptoms}</div>
              </div>
              
              <div className="medical-info-row highlight">
                <div className="medical-label">Chẩn đoán:</div>
                <div className="medical-value diagnosis-text">{record.diagnosis}</div>
              </div>
              
              {record.note && (
                <div className="medical-info-row">
                  <div className="medical-label">Ghi chú của bác sĩ:</div>
                  <div className="medical-value note-text">{record.note}</div>
                </div>
              )}
              
              {record.reexamination_date && (
                <div className="medical-info-row reexam-alert">
                  <div className="medical-label">
                    <span className="alert-icon">🔄</span>
                    Lịch tái khám:
                  </div>
                  <div className="medical-value reexam-date">
                    {formatDate(record.reexamination_date)}
                  </div>
                </div>
              )}
              
              <div className="medical-info-row metadata">
                <div className="medical-label">Ngày tạo hồ sơ:</div>
                <div className="medical-value">{formatDateTime(record.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Prescriptions Section */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="title-icon">💊</span>
              Đơn thuốc
            </h3>
            <PrescriptionsList medicalRecordId={medicalRecordId} />
          </div>

          {/* Action Buttons */}
          <div className="details-actions">
            <button className="btn btn-secondary" onClick={onBack}>
              ← Quay lại danh sách
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => window.print()}
            >
              🖨️ In hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordDetails;
