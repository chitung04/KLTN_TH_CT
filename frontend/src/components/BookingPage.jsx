import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './BookingPage.css';

const BookingPage = ({ onNavigate }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    departmentId: '',
    doctorId: '',
    appointmentDate: '',
    timeSlot: '',
    symptoms: '',
    notes: ''
  });

  // Success data
  const [bookingResult, setBookingResult] = useState(null);

  // Available time slots
  const timeSlots = [
    '08:00 - 08:30',
    '08:30 - 09:00',
    '09:00 - 09:30',
    '09:30 - 10:00',
    '10:00 - 10:30',
    '10:30 - 11:00',
    '13:30 - 14:00',
    '14:00 - 14:30',
    '14:30 - 15:00',
    '15:00 - 15:30',
    '15:30 - 16:00',
    '16:00 - 16:30'
  ];

  // Redirect to login if not authenticated (Requirement 7.2)
  // When unauthenticated user tries to access booking, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Navigate to home/login modal instead of using router
      if (onNavigate) {
        onNavigate('home'); // Navigate to home where login modal can be triggered
      }
      // Optionally show alert or trigger login modal
      alert('Vui lòng đăng nhập để đặt lịch khám');
    }
  }, [isAuthenticated, authLoading, onNavigate]);

  // Load departments and doctors
  useEffect(() => {
    if (isAuthenticated) {
      loadDoctorsAndDepartments();
    }
  }, [isAuthenticated]);

  const loadDoctorsAndDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/appointments/doctors');
      if (response.data.success) {
        setDepartments(response.data.departments);
        setDoctors(response.data.doctors);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Filter doctors by selected department
  const filteredDoctors = formData.departmentId
    ? doctors.filter(doc => doc.department_id == formData.departmentId)
    : doctors;

  // Get selected doctor info
  const selectedDoctor = doctors.find(doc => doc.doctor_id == formData.doctorId);
  const selectedDepartment = departments.find(dept => dept.id == formData.departmentId);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Validate current step
  const validateStep = (step) => {
    setError('');
    
    switch (step) {
      case 1:
        if (!formData.departmentId) {
          setError('Vui lòng chọn chuyên khoa');
          return false;
        }
        if (!formData.doctorId) {
          setError('Vui lòng chọn bác sĩ');
          return false;
        }
        break;
      case 2:
        if (!formData.appointmentDate) {
          setError('Vui lòng chọn ngày khám');
          return false;
        }
        if (!formData.timeSlot) {
          setError('Vui lòng chọn khung giờ');
          return false;
        }
        // Validate date is in the future
        const selectedDate = new Date(formData.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          setError('Ngày khám không thể là quá khứ');
          return false;
        }
        break;
      case 3:
        if (!formData.symptoms || formData.symptoms.trim().length < 10) {
          setError('Vui lòng mô tả triệu chứng (ít nhất 10 ký tự)');
          return false;
        }
        break;
    }
    
    return true;
  };

  // Navigate between steps
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  // Submit booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    // Verify user is still authenticated (Requirement 7.1)
    if (!user || !user.id) {
      setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      if (onNavigate) {
        onNavigate('home');
      }
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      
      // Auto-populate patient_id from authenticated user (Requirement 7.1)
      // This ensures the appointment is automatically linked to the logged-in patient
      const response = await axios.post(
        'http://localhost:5000/api/appointments/create',
        {
          patient_id: user.id, // Automatically use authenticated user's ID
          doctor_id: formData.doctorId,
          appointment_date: formData.appointmentDate,
          time_slot: formData.timeSlot,
          symptoms: formData.symptoms,
          notes: formData.notes
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setBookingResult(response.data);
        setCurrentStep(4);
      }
    } catch (err) {
      console.error('Booking error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        if (onNavigate) {
          onNavigate('home');
        }
      } else {
        setError(
          err.response?.data?.message || 
          'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại sau.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      departmentId: '',
      doctorId: '',
      appointmentDate: '',
      timeSlot: '',
      symptoms: '',
      notes: ''
    });
    setBookingResult(null);
    setCurrentStep(1);
    setError('');
  };

  // Get min date for date picker (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Check if user is authenticated - show loading while checking auth
  if (authLoading) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-content">
            <div className="booking-loading">
              <div className="loading-spinner"></div>
              <p className="loading-text">Đang kiểm tra phiên đăng nhập...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, this will be handled by the redirect effect
  // But show a fallback just in case
  if (!isAuthenticated) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-header">
            <h1>Đặt Lịch Khám Bệnh</h1>
            <p>Vui lòng đăng nhập để sử dụng chức năng này</p>
          </div>
          <div className="booking-content">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '16px', color: '#718096', marginBottom: '24px' }}>
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && departments.length === 0) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-content">
            <div className="booking-loading">
              <div className="loading-spinner"></div>
              <p className="loading-text">Đang tải thông tin...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <h1>📋 ĐĂNG KÝ KHÁM</h1>
          <p>Vui lòng điền thông tin sau vào form dưới đây để đặt lịch khám bệnh theo giờ của bạn</p>
          
          {/* Display logged-in user information (Requirement 7.1) */}
          {user && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px 16px', 
              background: '#f0f9ff', 
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0c4a6e'
            }}>
              <strong>👤 Đặt lịch cho:</strong> {user.full_name || user.fullName} ({user.email})
            </div>
          )}
        </div>

        <div className="booking-content">
          {/* Progress Steps */}
          {currentStep < 4 && (
            <div className="booking-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Chọn bác sĩ</div>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Chọn thời gian</div>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Xác nhận</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message" style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              padding: '16px', 
              borderRadius: '10px', 
              marginBottom: '24px' 
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Select Doctor */}
          <form onSubmit={handleSubmit}>
            <div className={`form-section ${currentStep === 1 ? 'active' : ''}`}>
              <h3 className="section-title">Chọn chuyên khoa và bác sĩ</h3>
              
              <div className="form-group">
                <label className="form-label">
                  Chuyên khoa <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={formData.departmentId}
                  onChange={(e) => {
                    handleChange('departmentId', e.target.value);
                    handleChange('doctorId', ''); // Reset doctor when department changes
                  }}
                >
                  <option value="">-- Chọn chuyên khoa --</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.departmentId && (
                <div className="form-group">
                  <label className="form-label">
                    Bác sĩ <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredDoctors.length === 0 ? (
                      <p style={{ color: '#718096', padding: '20px', textAlign: 'center' }}>
                        Không có bác sĩ nào trong chuyên khoa này
                      </p>
                    ) : (
                      filteredDoctors.map(doctor => (
                        <div
                          key={doctor.doctor_id}
                          className={`doctor-card ${formData.doctorId == doctor.doctor_id ? 'selected' : ''}`}
                          onClick={() => handleChange('doctorId', doctor.doctor_id)}
                        >
                          <div className="doctor-avatar">
                            {doctor.full_name.charAt(0)}
                          </div>
                          <div className="doctor-info">
                            <div className="doctor-name">
                              {doctor.degree || 'BS'} {doctor.full_name}
                            </div>
                            <div className="doctor-department">
                              {doctor.department_name}
                            </div>
                          </div>
                          {formData.doctorId == doctor.doctor_id && (
                            <div style={{ color: '#0ea5e9', fontSize: '24px' }}>✓</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <div></div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={!formData.departmentId || !formData.doctorId}
                >
                  <span>Tiếp tục</span>
                  <span className="btn-icon">→</span>
                </button>
              </div>
            </div>

            {/* Step 2: Select Date & Time */}
            <div className={`form-section ${currentStep === 2 ? 'active' : ''}`}>
              <h3 className="section-title">Chọn ngày và giờ khám</h3>
              
              <div className="form-group">
                <label className="form-label">
                  Ngày khám <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.appointmentDate}
                  onChange={(e) => handleChange('appointmentDate', e.target.value)}
                  min={getMinDate()}
                />
              </div>

              {formData.appointmentDate && (
                <div className="form-group">
                  <label className="form-label">
                    Khung giờ khám <span className="required">*</span>
                  </label>
                  <div className="time-slots">
                    {timeSlots.map(slot => (
                      <div
                        key={slot}
                        className={`time-slot ${formData.timeSlot === slot ? 'selected' : ''}`}
                        onClick={() => handleChange('timeSlot', slot)}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevStep}
                >
                  <span className="btn-icon">←</span>
                  <span>Quay lại</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={!formData.appointmentDate || !formData.timeSlot}
                >
                  <span>Tiếp tục</span>
                  <span className="btn-icon">→</span>
                </button>
              </div>
            </div>

            {/* Step 3: Symptoms & Confirm */}
            <div className={`form-section ${currentStep === 3 ? 'active' : ''}`}>
              <h3 className="section-title">Thông tin khám bệnh</h3>
              
              <div className="form-group">
                <label className="form-label">
                  Triệu chứng / Lý do khám <span className="required">*</span>
                </label>
                <textarea
                  className="form-control"
                  value={formData.symptoms}
                  onChange={(e) => handleChange('symptoms', e.target.value)}
                  placeholder="Mô tả chi tiết các triệu chứng của bạn..."
                  rows="4"
                />
                <small style={{ color: '#718096', fontSize: '14px' }}>
                  Tối thiểu 10 ký tự
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú thêm (không bắt buộc)</label>
                <textarea
                  className="form-control"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Thông tin bổ sung (tiền sử bệnh, thuốc đang dùng...)"
                  rows="3"
                />
              </div>

              {/* Booking Summary */}
              <div className="booking-summary">
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#2d3748', marginBottom: '16px' }}>
                  Thông tin đặt lịch
                </h4>
                <div className="summary-item">
                  <span className="summary-label">Chuyên khoa:</span>
                  <span className="summary-value">{selectedDepartment?.name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Bác sĩ:</span>
                  <span className="summary-value">
                    {selectedDoctor?.degree || 'BS'} {selectedDoctor?.full_name}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Ngày khám:</span>
                  <span className="summary-value">
                    {new Date(formData.appointmentDate).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Giờ khám:</span>
                  <span className="summary-value">{formData.timeSlot}</span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevStep}
                >
                  <span className="btn-icon">←</span>
                  <span>Quay lại</span>
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác nhận đặt lịch</span>
                      <span className="btn-icon">✓</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 4: Success */}
            {currentStep === 4 && bookingResult && (
              <div className="booking-success">
                <div className="success-icon">✓</div>
                <h2 className="success-title">Đặt lịch thành công!</h2>
                <p className="success-message">
                  Lịch khám của bạn đã được xác nhận. Vui lòng đến đúng giờ.
                </p>

                {/* User Details Section */}
                <div className="booking-summary" style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#2d3748', marginBottom: '16px' }}>
                    👤 Thông tin bệnh nhân
                  </h4>
                  <div className="summary-item">
                    <span className="summary-label">Họ và tên:</span>
                    <span className="summary-value">{user?.full_name || user?.fullName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Email:</span>
                    <span className="summary-value">{user?.email}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Số điện thoại:</span>
                    <span className="summary-value">{user?.phone}</span>
                  </div>
                </div>

                <div className="appointment-code">
                  <div className="appointment-code-label">Mã lịch hẹn của bạn</div>
                  <div className="appointment-code-value">{bookingResult.appointmentCode}</div>
                </div>

                <div className="qr-code-container">
                  <img src={bookingResult.qrCode} alt="QR Check-in" />
                </div>

                <div className="qr-instructions">
                  <p><strong>📱 Hướng dẫn sử dụng mã QR:</strong></p>
                  <p>1. Chụp màn hình hoặc lưu mã QR này lại</p>
                  <p>2. Đến phòng khám trước giờ hẹn 15 phút</p>
                  <p>3. Xuất trình mã QR tại quầy lễ tân để check-in nhanh chóng</p>
                </div>

                <div className="form-actions" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={resetForm}
                  >
                    Đặt lịch khác
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
