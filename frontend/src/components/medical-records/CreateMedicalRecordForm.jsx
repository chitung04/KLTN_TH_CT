import React, { useState } from 'react';
import { createMedicalRecord, getMinReexaminationDate } from '../../services/medicalRecordsService';
import './MedicalRecords.css';

/**
 * CreateMedicalRecordForm Component
 * 
 * Form for doctor to create a medical record for a checked-in patient.
 * Pre-fills symptoms from appointment, requires diagnosis.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
const CreateMedicalRecordForm = ({ patient, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    symptoms: patient?.symptoms || '',
    diagnosis: '',
    note: '',
    reexamination_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.symptoms.trim()) {
      setError('Vui lòng nhập triệu chứng');
      return false;
    }
    if (!formData.diagnosis.trim()) {
      setError('Vui lòng nhập chẩn đoán');
      return false;
    }
    if (formData.reexamination_date) {
      const selectedDate = new Date(formData.reexamination_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        setError('Ngày tái khám phải là ngày trong tương lai');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const payload = {
        appointment_id: patient.appointment_id,
        symptoms: formData.symptoms.trim(),
        diagnosis: formData.diagnosis.trim(),
        note: formData.note.trim() || null,
        reexamination_date: formData.reexamination_date || null
      };

      const response = await createMedicalRecord(payload);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data?.medicalRecord);
        }
      } else {
        setError(response.message || 'Không thể tạo hồ sơ khám bệnh');
      }
    } catch (err) {
      console.error('Error creating medical record:', err);
      setError(err.message || 'Có lỗi xảy ra khi tạo hồ sơ khám bệnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-medical-record-container">
      <div className="form-header">
        <h2>Tạo hồ sơ khám bệnh</h2>
        <button className="btn-close" onClick={onCancel} aria-label="Đóng">
          ×
        </button>
      </div>

      <div className="patient-summary">
        <div className="summary-title">Thông tin bệnh nhân</div>
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-label">Họ tên:</span>
            <span className="summary-value">{patient?.patient_fullname}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Số điện thoại:</span>
            <span className="summary-value">{patient?.phone || 'Chưa cập nhật'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Khung giờ:</span>
            <span className="summary-value">{patient?.time_slot}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="medical-record-form">
        {error && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Triệu chứng <span className="required">*</span>
          </label>
          <textarea
            className="form-control"
            value={formData.symptoms}
            onChange={(e) => handleChange('symptoms', e.target.value)}
            rows="4"
            placeholder="Mô tả triệu chứng của bệnh nhân..."
            disabled={loading}
          />
          <small className="form-hint">
            Triệu chứng đã được điền sẵn từ lịch hẹn, bạn có thể chỉnh sửa nếu cần
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">
            Chẩn đoán <span className="required">*</span>
          </label>
          <textarea
            className="form-control"
            value={formData.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
            rows="4"
            placeholder="Nhập chẩn đoán bệnh..."
            disabled={loading}
          />
          <small className="form-hint">
            Chẩn đoán bệnh dựa trên khám lâm sàng và triệu chứng
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Ghi chú</label>
          <textarea
            className="form-control"
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            rows="3"
            placeholder="Ghi chú thêm (nếu có)..."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ngày tái khám</label>
          <input
            type="date"
            className="form-control"
            value={formData.reexamination_date}
            onChange={(e) => handleChange('reexamination_date', e.target.value)}
            min={getMinReexaminationDate()}
            disabled={loading}
          />
          <small className="form-hint">
            Để trống nếu không cần tái khám
          </small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Tạo hồ sơ</span>
                <span className="btn-icon">✓</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMedicalRecordForm;
