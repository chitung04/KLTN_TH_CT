import React from 'react';
import PropTypes from 'prop-types';
import './MedicalRecords.css';

/**
 * MedicalRecordCard Component
 * 
 * Reusable card component for displaying medical record summary
 * Styled consistently with existing dashboard cards
 * 
 * Props:
 * - record: Medical record data object
 * - onClick: Handler function when card is clicked
 * 
 * Requirements: Medical Records System - Task 20.1
 */
const MedicalRecordCard = ({ record, onClick }) => {
  // Format date to Vietnamese locale
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (reexaminationDate) => {
    if (!reexaminationDate) return '#6b7280'; // Gray for no reexamination
    const now = new Date();
    const reexamDate = new Date(reexaminationDate);
    if (reexamDate < now) return '#ef4444'; // Red for overdue
    return '#10b981'; // Green for upcoming
  };

  return (
    <div 
      className="medical-record-card" 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick && onClick();
        }
      }}
    >
      {/* Card Header */}
      <div className="record-card-header">
        <div className="record-date-info">
          <span className="record-icon">📅</span>
          <div>
            <strong className="record-date">{formatDate(record.appointment_date)}</strong>
            <p className="record-time">Khám lúc: {record.time_slot || 'N/A'}</p>
          </div>
        </div>
        {record.reexamination_date && (
          <span 
            className="reexam-badge" 
            style={{ 
              backgroundColor: `${getStatusColor(record.reexamination_date)}20`,
              color: getStatusColor(record.reexamination_date)
            }}
          >
            🔄 Tái khám
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="record-card-body">
        <div className="record-info-row">
          <span className="record-label">👨‍⚕️ Bác sĩ:</span>
          <span className="record-value">
            BS. {record.doctor_name || record.doctorName || 'N/A'}
          </span>
        </div>

        <div className="record-info-row">
          <span className="record-label">🏥 Khoa:</span>
          <span className="record-value">
            {record.department_name || record.departmentName || 'N/A'}
          </span>
        </div>

        {record.symptoms && (
          <div className="record-info-row">
            <span className="record-label">🤒 Triệu chứng:</span>
            <span className="record-value truncate">{record.symptoms}</span>
          </div>
        )}

        {record.diagnosis && (
          <div className="record-info-row">
            <span className="record-label">🩺 Chẩn đoán:</span>
            <span className="record-value truncate">{record.diagnosis}</span>
          </div>
        )}

        {record.reexamination_date && (
          <div className="record-info-row">
            <span className="record-label">📆 Tái khám:</span>
            <span className="record-value">
              {formatDate(record.reexamination_date)}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="record-card-footer">
        <button className="btn-view-details">
          Xem chi tiết →
        </button>
      </div>
    </div>
  );
};

MedicalRecordCard.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    appointment_date: PropTypes.string,
    time_slot: PropTypes.string,
    doctor_name: PropTypes.string,
    doctorName: PropTypes.string,
    department_name: PropTypes.string,
    departmentName: PropTypes.string,
    symptoms: PropTypes.string,
    diagnosis: PropTypes.string,
    reexamination_date: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func
};

MedicalRecordCard.defaultProps = {
  onClick: () => {}
};

export default MedicalRecordCard;
