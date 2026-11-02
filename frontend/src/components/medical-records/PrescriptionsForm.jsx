import React, { useState } from 'react';
import { createPrescriptions } from '../../services/medicalRecordsService';
import './MedicalRecords.css';

/**
 * PrescriptionsForm Component
 * 
 * Dynamic form for doctor to add multiple prescriptions to a medical record.
 * Allows adding/removing prescription rows dynamically.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
const PrescriptionsForm = ({ medicalRecordId, patient, onSuccess, onSkip }) => {
  const [prescriptions, setPrescriptions] = useState([
    { medicine_name: '', dosage: '', quantity: 1, instructions: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicine_name: '', dosage: '', quantity: 1, instructions: '' }
    ]);
  };

  const handleRemovePrescription = (index) => {
    if (prescriptions.length > 1) {
      setPrescriptions(prescriptions.filter((_, i) => i !== index));
    }
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
    setError('');
  };

  const validateForm = () => {
    for (let i = 0; i < prescriptions.length; i++) {
      const prescription = prescriptions[i];
      
      if (!prescription.medicine_name.trim()) {
        setError(`Vui lòng nhập tên thuốc cho đơn thuốc ${i + 1}`);
        return false;
      }
      
      if (!prescription.dosage.trim()) {
        setError(`Vui lòng nhập liều lượng cho đơn thuốc ${i + 1}`);
        return false;
      }
      
      if (!prescription.quantity || prescription.quantity <= 0) {
        setError(`Số lượng thuốc phải lớn hơn 0 cho đơn thuốc ${i + 1}`);
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

      const cleanedPrescriptions = prescriptions.map(p => ({
        medicine_name: p.medicine_name.trim(),
        dosage: p.dosage.trim(),
        quantity: parseInt(p.quantity),
        instructions: p.instructions.trim() || null
      }));

      const response = await createPrescriptions(medicalRecordId, cleanedPrescriptions);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data?.prescriptionIds);
        }
      } else {
        setError(response.message || 'Không thể tạo đơn thuốc');
      }
    } catch (err) {
      console.error('Error creating prescriptions:', err);
      setError(err.message || 'Có lỗi xảy ra khi tạo đơn thuốc');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="prescriptions-form-container">
      <div className="form-header">
        <h2>Thêm đơn thuốc</h2>
        <div className="form-subtitle">
          Bệnh nhân: <strong>{patient?.patient_fullname}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="prescriptions-form">
        {error && (
          <div className="form-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="prescriptions-list">
          {prescriptions.map((prescription, index) => (
            <div key={index} className="prescription-item">
              <div className="prescription-header">
                <span className="prescription-number">Đơn thuốc #{index + 1}</span>
                {prescriptions.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleRemovePrescription(index)}
                    disabled={loading}
                    aria-label="Xóa đơn thuốc"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <div className="prescription-fields">
                <div className="form-group">
                  <label className="form-label">
                    Tên thuốc <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={prescription.medicine_name}
                    onChange={(e) => handlePrescriptionChange(index, 'medicine_name', e.target.value)}
                    placeholder="VD: Paracetamol 500mg"
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Liều lượng <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={prescription.dosage}
                      onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                      placeholder="VD: 1 viên/lần"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Số lượng <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={prescription.quantity}
                      onChange={(e) => handlePrescriptionChange(index, 'quantity', e.target.value)}
                      min="1"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Hướng dẫn sử dụng</label>
                  <textarea
                    className="form-control"
                    value={prescription.instructions}
                    onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                    rows="2"
                    placeholder="VD: Uống 3 lần/ngày sau ăn"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-add-prescription"
          onClick={handleAddPrescription}
          disabled={loading}
        >
          <span>➕</span>
          <span>Thêm đơn thuốc</span>
        </button>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSkip}
            disabled={loading}
          >
            Bỏ qua
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
                <span>Lưu đơn thuốc</span>
                <span className="btn-icon">✓</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionsForm;
