import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import QRCodeDisplay from './QRCodeDisplay';
import './QuickBookingForm.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

/**
 * Quick Booking Form - Simple, fast, one-page booking
 */
const QuickBookingForm = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState(null);
  
  const [formData, setFormData] = useState({
    departmentId: '',
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    symptoms: ''
  });

  useEffect(() => {
    loadDepartmentsAndDoctors();
  }, []);

  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [formData.doctorId, formData.appointmentDate]);

  // Smart AI Recommendation Algorithm
  const getSmartRecommendation = () => {
    if (!availableSlots.length) return null;
    
    const availableOnly = availableSlots.filter(s => s.available);
    if (!availableOnly.length) return null;

    const now = new Date();
    const selectedDate = new Date(formData.appointmentDate);
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Scoring algorithm
    const scoredSlots = availableOnly.map(slot => {
      const [hour, minute] = slot.timeSlot.split(':').map(Number);
      let score = 0;
      let reasons = [];

      // 1. Time validity check (for today)
      if (isToday) {
        const slotTime = hour * 60 + minute;
        const currentTime = currentHour * 60 + currentMinute;
        if (slotTime <= currentTime + 30) return null; // Too soon
      }

      // 2. Optimal time windows (high score for best times)
      if (hour >= 8 && hour <= 9) {
        score += 50;
        reasons.push('🌅 Sáng sớm - Bác sĩ tỉnh táo nhất');
      } else if (hour >= 14 && hour <= 15) {
        score += 40;
        reasons.push('☀️ Sau nghỉ trưa - Không vội vàng');
      } else if (hour >= 10 && hour <= 11) {
        score += 35;
        reasons.push('⏰ Cuối buổi sáng - Vẫn còn thoải mái');
      }

      // 3. Avoid rush hours
      if (hour >= 7 && hour < 8) {
        score += 20;
        reasons.push('⚡ Sớm nhất - Không phải chờ');
      }
      if (hour >= 16 && hour <= 18) {
        score -= 10; // Slightly penalize late afternoon (people tired)
      }

      // 4. Prefer earlier times (small bonus)
      const minutesFromMidnight = hour * 60 + minute;
      score += (1440 - minutesFromMidnight) / 100; // Earlier = slightly better

      // 5. Avoid very late slots
      if (hour >= 19) {
        score -= 20;
        reasons.push('⚠️ Muộn - Có thể mệt');
      }

      // 6. Perfect timing (on the hour or half-hour)
      if (minute === 0 || minute === 30) {
        score += 5;
      }

      // 7. Weekend bonus (if applicable)
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        if (hour >= 9 && hour <= 11) {
          score += 15;
          reasons.push('📅 Cuối tuần - Thời gian lý tưởng');
        }
      }

      // 8. Weekday morning bonus
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (hour >= 8 && hour <= 9) {
          score += 10;
        }
      }

      return {
        slot,
        score,
        reasons: reasons.slice(0, 2), // Top 2 reasons
        timeCategory: getTimeCategory(hour)
      };
    }).filter(Boolean);

    // Sort by score (highest first)
    scoredSlots.sort((a, b) => b.score - a.score);

    return scoredSlots[0]; // Best recommendation
  };

  const getTimeCategory = (hour) => {
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  };

  const smartRecommendation = getSmartRecommendation();

  const loadDepartmentsAndDoctors = async () => {
    try {
      const response = await axios.get(`${API_BASE}/appointments/doctors`);
      if (response.data.success) {
        setDepartments(response.data.departments || []);
        setDoctors(response.data.doctors || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/appointments/slots`, {
        params: {
          doctorId: formData.doctorId,
          date: formData.appointmentDate
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAvailableSlots(response.data.slots || []);
      }
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = formData.departmentId
    ? doctors.filter(doc => doc.department_id === parseInt(formData.departmentId))
    : [];

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'departmentId') {
        newData.doctorId = '';
        newData.appointmentDate = '';
        newData.timeSlot = '';
      }
      if (field === 'doctorId' || field === 'appointmentDate') {
        newData.timeSlot = '';
      }
      return newData;
    });
    setError('');
    
    // Auto-scroll to next section smoothly
    setTimeout(() => {
      const form = document.querySelector('.quick-form');
      if (form) {
        const nextInput = form.querySelector(`[name="${getNextField(field)}"]`);
        if (nextInput) {
          nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  };

  const getNextField = (currentField) => {
    const fieldOrder = ['departmentId', 'doctorId', 'appointmentDate', 'timeSlot', 'symptoms'];
    const currentIndex = fieldOrder.indexOf(currentField);
    return fieldOrder[currentIndex + 1];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.departmentId || !formData.doctorId || !formData.appointmentDate || !formData.timeSlot) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE}/appointments/create`,
        {
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          timeSlot: formData.timeSlot,
          symptoms: formData.symptoms || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAppointmentResult(response.data.appointment);
        setSuccess(true);
        if (onSuccess) onSuccess(response.data.appointment);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      departmentId: '',
      doctorId: '',
      appointmentDate: '',
      timeSlot: '',
      symptoms: ''
    });
    setSuccess(false);
    setAppointmentResult(null);
    setError('');
  };

  if (success && appointmentResult) {
    return (
      <div className="quick-booking-container">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2>Đặt lịch thành công!</h2>
          <p>Mã QR của bạn đã sẵn sàng</p>
          
          <QRCodeDisplay appointment={appointmentResult} />
          
          <div className="success-actions">
            <button className="btn-secondary" onClick={resetForm}>
              Đặt lịch khác
            </button>
            {onBack && (
              <button className="btn-primary" onClick={onBack}>
                Về Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-booking-container">
      <div className="quick-booking-card">
        {onBack && (
          <button className="btn-back" onClick={onBack}>← Quay lại</button>
        )}
        
        <h1>📅 Đặt lịch khám nhanh</h1>
        <p className="subtitle">Điền thông tin để đặt lịch ngay</p>

        {error && <div className="error-alert">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="quick-form">
          {/* Chuyên khoa */}
          <div className="form-group">
            <label>
              <span className="step-number">1</span>
              Chuyên khoa *
            </label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={(e) => handleChange('departmentId', e.target.value)}
              required
            >
              <option value="">-- Chọn chuyên khoa --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bác sĩ - Auto show when department selected */}
          {formData.departmentId && (
            <div className="form-group slide-in">
              <label>
                <span className="step-number">2</span>
                Bác sĩ *
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={(e) => handleChange('doctorId', e.target.value)}
                required
                autoFocus
              >
                <option value="">-- Chọn bác sĩ --</option>
                {filteredDoctors.map(doctor => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.degree || 'BS'} {doctor.full_name}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn-back-step"
                onClick={() => handleChange('departmentId', '')}
              >
                ← Đổi chuyên khoa
              </button>
            </div>
          )}

          {/* Ngày khám - Auto show when doctor selected */}
          {formData.doctorId && (
            <div className="form-group slide-in">
              <label>
                <span className="step-number">3</span>
                Ngày khám *
              </label>
              <input
                name="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleChange('appointmentDate', e.target.value)}
                min={getMinDate()}
                required
                autoFocus
              />
              <button 
                type="button" 
                className="btn-back-step"
                onClick={() => handleChange('doctorId', '')}
              >
                ← Đổi bác sĩ
              </button>
            </div>
          )}

          {/* Giờ khám - Auto show when date selected */}
          {formData.appointmentDate && (
            <div className="form-group slide-in">
              <label>
                <span className="step-number">4</span>
                Giờ khám *
              </label>
              
              {/* Smart Recommendation */}
              {smartRecommendation && !formData.timeSlot && (
                <div className="smart-recommendation-box">
                  <div className="ai-header">
                    <span className="ai-icon">🤖</span>
                    <strong>Gợi ý thông minh</strong>
                  </div>
                  <div 
                    className="recommendation-time"
                    onClick={() => handleChange('timeSlot', smartRecommendation.slot.timeSlot)}
                  >
                    <div className="rec-time-display">
                      <span className="time-big">{smartRecommendation.slot.timeSlot}</span>
                      <span className={`time-badge ${smartRecommendation.timeCategory}`}>
                        {smartRecommendation.timeCategory === 'morning' && '🌅 Buổi sáng'}
                        {smartRecommendation.timeCategory === 'afternoon' && '☀️ Buổi chiều'}
                        {smartRecommendation.timeCategory === 'evening' && '🌙 Buổi tối'}
                      </span>
                    </div>
                    <div className="rec-reasons">
                      {smartRecommendation.reasons.map((reason, idx) => (
                        <div key={idx} className="reason-item">{reason}</div>
                      ))}
                    </div>
                    <button type="button" className="btn-use-recommendation">
                      ⭐ Chọn giờ này
                    </button>
                  </div>
                  <div className="or-divider">
                    <span>hoặc chọn giờ khác</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="loading-slots">⏳ Đang tải khung giờ...</div>
              ) : availableSlots.length === 0 ? (
                <div className="no-slots">😔 Không có giờ trống trong ngày này</div>
              ) : (
                <select
                  name="timeSlot"
                  value={formData.timeSlot}
                  onChange={(e) => handleChange('timeSlot', e.target.value)}
                  required
                  className={formData.timeSlot ? 'selected' : ''}
                  autoFocus
                >
                  <option value="">-- Chọn giờ khám --</option>
                  {availableSlots
                    .filter(slot => slot.available)
                    .map(slot => (
                      <option key={slot.timeSlot} value={slot.timeSlot}>
                        {slot.timeSlot}
                        {smartRecommendation && slot.timeSlot === smartRecommendation.slot.timeSlot && ' ⭐ (Đề xuất)'}
                      </option>
                    ))}
                </select>
              )}
              <button 
                type="button" 
                className="btn-back-step"
                onClick={() => handleChange('appointmentDate', '')}
              >
                ← Đổi ngày
              </button>
            </div>
          )}

          {/* Triệu chứng - Auto show when time selected */}
          {formData.timeSlot && (
            <div className="form-group slide-in">
              <label>
                <span className="step-number">5</span>
                Triệu chứng (không bắt buộc)
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={(e) => handleChange('symptoms', e.target.value)}
                placeholder="Mô tả triệu chứng..."
                rows="3"
                maxLength="500"
                autoFocus
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !formData.timeSlot}
          >
            {loading ? 'Đang xử lý...' : '✓ Đặt lịch ngay'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickBookingForm;
