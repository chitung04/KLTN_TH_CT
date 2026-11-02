import React, { useState } from 'react';
import { updateReexaminationDate, completeAppointment, getMinReexaminationDate } from '../../services/medicalRecordsService';
import './MedicalRecords.css';

/**
 * MedicalRecordActions Component
 * 
 * Actions for managing a medical record:
 * - Update reexamination date
 * - Complete appointment
 * 
 * Requirements: 4.1, 4.2, 5.1, 5.2
 */
const MedicalRecordActions = ({ medicalRecordId, appointmentId, currentReexaminationDate, onSuccess }) => {
  const [showReexaminationModal, setShowReexaminationModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [reexaminationDate, setReexaminationDate] = useState(currentReexaminationDate || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateReexamination = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate date
      if (reexaminationDate) {
        const selectedDate = new Date(reexaminationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
          setError('Ngày tái khám phải là ngày trong tương lai');
          setLoading(false);
          return;
        }
      }

      const response = await updateReexaminationDate(
        medicalRecordId,
        reexaminationDate || null
      );

      if (response.success) {
        setShowReexaminationModal(false);
        if (onSuccess) {
          onSuccess('reexamination_updated');
        }
      } else {
        setError(response.message || 'Không thể cập nhật ngày tái khám');
      }
    } catch (err) {
      console.error('Error updating reexamination date:', err);
      setError(err.message || 'Có lỗi xảy ra khi cập nhật ngày tái khám');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await completeAppointment(appointmentId);

      if (response.success) {
        setShowCompleteModal(false);
        if (onSuccess) {
          onSuccess('appointment_completed');
        }
      } else {
        setError(response.message || 'Không thể hoàn thành lịch hẹn');
      }
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError(err.message || 'Có lỗi xảy ra khi hoàn thành lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-record-actions">
      <button
        className="btn btn-secondary"
        onClick={() => setShowReexaminationModal(true)}
        disabled={loading}
      >
        <span>📅</span>
        <span>Cập nhật ngày tái khám</span>
      </button>

      <button
        className="btn btn-success"
        onClick={() => setShowCompleteModal(true)}
        disabled={loading}
      >
        <span>✓</span>
        <span>Hoàn thành khám</span>
      </button>

      {/* Reexamination Date Modal */}
      {showReexaminationModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowReexaminationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cập nhật ngày tái khám</h3>
              <button
                className="btn-close"
                onClick={() => setShowReexaminationModal(false)}
                disabled={loading}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="form-error">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Ngày tái khám</label>
                <input
                  type="date"
                  className="form-control"
                  value={reexaminationDate}
                  onChange={(e) => {
                    setReexaminationDate(e.target.value);
                    setError('');
                  }}
                  min={getMinReexaminationDate()}
                  disabled={loading}
                />
                <small className="form-hint">
                  Để trống nếu không cần tái khám
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowReexaminationModal(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateReexamination}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Cập nhật</span>
                    <span className="btn-icon">✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Appointment Modal */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowCompleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hoàn thành khám bệnh</h3>
              <button
                className="btn-close"
                onClick={() => setShowCompleteModal(false)}
                disabled={loading}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="form-error">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="confirmation-message">
                <div className="confirmation-icon">✓</div>
                <p>
                  Xác nhận hoàn thành khám bệnh cho lịch hẹn này?
                </p>
                <p className="confirmation-note">
                  Sau khi hoàn thành, trạng thái lịch hẹn sẽ được đổi thành "Đã hoàn thành".
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCompleteModal(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className="btn btn-success"
                onClick={handleCompleteAppointment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Xác nhận hoàn thành</span>
                    <span className="btn-icon">✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordActions;
