import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SaveMedicalRecord.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

/**
 * SaveMedicalRecord Component
 * Allows doctors to create and save patient medical records
 */
const SaveMedicalRecord = ({ appointmentId, patientInfo, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    patientId: patientInfo?.id || '',
    appointmentId: appointmentId || '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    notes: '',
    followUpDate: '',
    vitalSigns: {
      bloodPressure: '',
      temperature: '',
      heartRate: '',
      weight: '',
      height: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVitalSignChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.symptoms || !formData.diagnosis) {
      alert('Vui lòng nhập triệu chứng và chẩn đoán!');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE}/medical-records`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Lưu hồ sơ bệnh án thành công!');
        if (onSaved) onSaved(response.data.record);
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="save-medical-record-container">
      <div className="medical-record-header">
        <h2>📋 Lưu Hồ Sơ Bệnh Án</h2>
        {patientInfo && (
          <div className="patient-info-badge">
            <strong>Bệnh nhân:</strong> {patientInfo.name} | {patientInfo.phone}
          </div>
        )}
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      {error && (
        <div className="error-alert">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="medical-record-form">
        {/* Vital Signs */}
        <div className="form-section">
          <h3>🩺 Sinh hiệu</h3>
          <div className="vital-signs-grid">
            <div className="form-group">
              <label>Huyết áp (mmHg)</label>
              <input
                type="text"
                name="bloodPressure"
                value={formData.vitalSigns.bloodPressure}
                onChange={handleVitalSignChange}
                placeholder="120/80"
              />
            </div>
            <div className="form-group">
              <label>Nhiệt độ (°C)</label>
              <input
                type="text"
                name="temperature"
                value={formData.vitalSigns.temperature}
                onChange={handleVitalSignChange}
                placeholder="36.5"
              />
            </div>
            <div className="form-group">
              <label>Nhịp tim (bpm)</label>
              <input
                type="text"
                name="heartRate"
                value={formData.vitalSigns.heartRate}
                onChange={handleVitalSignChange}
                placeholder="72"
              />
            </div>
            <div className="form-group">
              <label>Cân nặng (kg)</label>
              <input
                type="text"
                name="weight"
                value={formData.vitalSigns.weight}
                onChange={handleVitalSignChange}
                placeholder="65"
              />
            </div>
            <div className="form-group">
              <label>Chiều cao (cm)</label>
              <input
                type="text"
                name="height"
                value={formData.vitalSigns.height}
                onChange={handleVitalSignChange}
                placeholder="170"
              />
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="form-section">
          <h3>🤒 Triệu chứng *</h3>
          <textarea
            name="symptoms"
            value={formData.symptoms}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Mô tả triệu chứng của bệnh nhân..."
          />
        </div>

        {/* Diagnosis */}
        <div className="form-section">
          <h3>🔍 Chẩn đoán *</h3>
          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Chẩn đoán bệnh..."
          />
        </div>

        {/* Treatment */}
        <div className="form-section">
          <h3>💊 Phương pháp điều trị</h3>
          <textarea
            name="treatment"
            value={formData.treatment}
            onChange={handleChange}
            rows="3"
            placeholder="Phương pháp điều trị..."
          />
        </div>

        {/* Prescription */}
        <div className="form-section">
          <h3>💉 Đơn thuốc</h3>
          <textarea
            name="prescription"
            value={formData.prescription}
            onChange={handleChange}
            rows="5"
            placeholder="Tên thuốc - Liều lượng - Cách dùng&#10;Ví dụ: Paracetamol 500mg - 2 viên/lần - Uống khi sốt"
          />
        </div>

        {/* Follow-up Date */}
        <div className="form-section">
          <h3>📅 Ngày tái khám</h3>
          <input
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Notes */}
        <div className="form-section">
          <h3>📝 Ghi chú</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Ghi chú thêm..."
          />
        </div>

        <div className="form-actions">
          {onClose && (
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
          )}
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? '⏳ Đang lưu...' : '💾 Lưu hồ sơ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaveMedicalRecord;
