import React, { useState, useEffect } from 'react';
import { getPrescriptions } from '../../services/medicalRecordsService';
import './MedicalRecords.css';

/**
 * PrescriptionsList Component
 * 
 * Display prescriptions from getPrescriptions API
 * Show medicine_name, dosage, quantity, instructions in table format
 * Handle empty state (no prescriptions)
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
const PrescriptionsList = ({ medicalRecordId }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (medicalRecordId) {
      loadPrescriptions();
    }
  }, [medicalRecordId]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPrescriptions(medicalRecordId);
      setPrescriptions(data);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
      setError(err.message || 'Không thể tải đơn thuốc. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="prescriptions-loading">
        <div className="loading-spinner small"></div>
        <p>Đang tải đơn thuốc...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prescriptions-error">
        <div className="error-icon small">⚠️</div>
        <p>{error}</p>
        <button className="btn btn-sm btn-primary" onClick={loadPrescriptions}>
          Thử lại
        </button>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="prescriptions-empty">
        <div className="empty-icon">💊</div>
        <p>Không có đơn thuốc</p>
        <small>Bác sĩ chưa kê đơn thuốc cho lần khám này</small>
      </div>
    );
  }

  return (
    <div className="prescriptions-list">
      <div className="prescriptions-count">
        <span className="count-badge">{prescriptions.length}</span>
        <span className="count-text">loại thuốc được kê đơn</span>
      </div>

      <div className="prescriptions-table-container">
        <table className="prescriptions-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên thuốc</th>
              <th>Liều lượng</th>
              <th>Số lượng</th>
              <th>Hướng dẫn sử dụng</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((prescription, index) => (
              <tr key={prescription.prescription_id}>
                <td className="col-number">{index + 1}</td>
                <td className="col-medicine">
                  <div className="medicine-name">
                    <span className="medicine-icon">💊</span>
                    {prescription.medicine_name}
                  </div>
                </td>
                <td className="col-dosage">
                  {prescription.dosage || '-'}
                </td>
                <td className="col-quantity">
                  <span className="quantity-badge">
                    {prescription.quantity}
                  </span>
                </td>
                <td className="col-instructions">
                  {prescription.instructions || 'Theo chỉ dẫn của bác sĩ'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Cards */}
      <div className="prescriptions-cards">
        {prescriptions.map((prescription, index) => (
          <div key={prescription.prescription_id} className="prescription-card">
            <div className="prescription-card-header">
              <span className="card-number">#{index + 1}</span>
              <span className="card-quantity">{prescription.quantity} viên</span>
            </div>
            <div className="prescription-card-body">
              <div className="card-medicine-name">
                <span className="medicine-icon">💊</span>
                {prescription.medicine_name}
              </div>
              {prescription.dosage && (
                <div className="card-info-row">
                  <span className="card-label">Liều lượng:</span>
                  <span className="card-value">{prescription.dosage}</span>
                </div>
              )}
              <div className="card-info-row">
                <span className="card-label">Hướng dẫn:</span>
                <span className="card-value">
                  {prescription.instructions || 'Theo chỉ dẫn của bác sĩ'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="prescriptions-note">
        <div className="note-icon">ℹ️</div>
        <div className="note-content">
          <strong>Lưu ý:</strong> Vui lòng sử dụng thuốc theo đúng chỉ dẫn của bác sĩ. 
          Không tự ý thay đổi liều lượng hoặc ngừng thuốc. 
          Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với bác sĩ hoặc dược sĩ.
        </div>
      </div>
    </div>
  );
};

export default PrescriptionsList;
