import React, { useState, useEffect } from 'react';
import { getCheckedInPatients } from '../../services/medicalRecordsService';
import './MedicalRecords.css';

/**
 * CheckedInPatientsList Component
 * 
 * Displays list of checked-in patients for the authenticated doctor.
 * Allows doctor to select a patient to create medical record.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
const CheckedInPatientsList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCheckedInPatients();
  }, []);

  const loadCheckedInPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getCheckedInPatients();
      
      if (response.success) {
        setPatients(response.data?.appointments || []);
      } else {
        setError(response.message || 'Không thể tải danh sách bệnh nhân');
      }
    } catch (err) {
      console.error('Error loading checked-in patients:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient) => {
    if (onSelectPatient) {
      onSelectPatient(patient);
    }
  };

  const handleRefresh = () => {
    loadCheckedInPatients();
  };

  if (loading) {
    return (
      <div className="medical-records-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang tải danh sách bệnh nhân...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medical-records-error">
        <div className="error-icon">⚠️</div>
        <p className="error-text">{error}</p>
        <button className="btn btn-secondary" onClick={handleRefresh}>
          Thử lại
        </button>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="medical-records-empty">
        <div className="empty-icon">👥</div>
        <h3 className="empty-title">Không có bệnh nhân chờ khám</h3>
        <p className="empty-text">
          Hiện tại không có bệnh nhân nào đã check-in và chờ khám.
        </p>
        <button className="btn btn-secondary" onClick={handleRefresh}>
          <span>🔄</span>
          <span>Làm mới</span>
        </button>
      </div>
    );
  }

  return (
    <div className="checked-in-patients-container">
      <div className="patients-header">
        <div className="patients-title">
          <h2>Bệnh nhân chờ khám hôm nay</h2>
          <span className="patients-count">{patients.length} bệnh nhân</span>
        </div>
        <button className="btn btn-secondary btn-icon-only" onClick={handleRefresh} title="Làm mới">
          🔄
        </button>
      </div>

      <div className="patients-list">
        {patients.map((patient) => (
          <div key={patient.appointment_id} className="patient-card">
            <div className="patient-time-slot">
              <div className="time-slot-icon">🕐</div>
              <div className="time-slot-text">{patient.time_slot}</div>
            </div>

            <div className="patient-info">
              <div className="patient-header">
                <div className="patient-name">
                  <span className="name-icon">👤</span>
                  <span className="name-text">{patient.patient_fullname}</span>
                </div>
                <div className="patient-status checked-in">
                  Đã check-in
                </div>
              </div>

              <div className="patient-details">
                <div className="detail-item">
                  <span className="detail-icon">📞</span>
                  <span className="detail-text">{patient.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🏥</span>
                  <span className="detail-text">{patient.department_name}</span>
                </div>
              </div>

              <div className="patient-symptoms">
                <div className="symptoms-label">Triệu chứng:</div>
                <div className="symptoms-text">{patient.symptoms}</div>
              </div>
            </div>

            <div className="patient-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleSelectPatient(patient)}
              >
                <span>Tạo hồ sơ khám</span>
                <span className="btn-icon">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckedInPatientsList;
