import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './AdminAppointments.css';

/**
 * AdminAppointments Component - System-wide appointment management for administrators
 * 
 * Features:
 * - View all appointments across all doctors and departments
 * - Filter by status, date, doctor, department
 * - Search appointments by patient name or ID
 * - Update appointment status
 * - Cancel appointments
 * - Export appointment data
 * 
 * Requirements Validation:
 * - Requirement 7.3: Admins can manage all appointments system-wide
 * - Requirement 7.4: System-wide appointment visibility for admins
 * - Requirement 3.4: Admin role has access to all system functions
 */
const AdminAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    doctorId: 'all',
    departmentId: 'all',
    searchQuery: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    booked: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0
  });

  // Fetch all appointments (admin view)
  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      
      // Fetch appointments
      const appointmentsResponse = await axios.get(
        'http://localhost:5000/api/appointments/all',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (appointmentsResponse.data.success) {
        setAppointments(appointmentsResponse.data.appointments || []);
        calculateStats(appointmentsResponse.data.appointments || []);
      }

      // Fetch doctors and departments for filters
      const doctorsResponse = await axios.get('http://localhost:5000/api/appointments/doctors');
      if (doctorsResponse.data.success) {
        setDoctors(doctorsResponse.data.doctors || []);
        
        // Extract unique departments from doctors
        const uniqueDepartments = [...new Map(
          doctorsResponse.data.doctors.map(d => [d.department_id, {
            id: d.department_id,
            name: d.department_name
          }])
        ).values()];
        setDepartments(uniqueDepartments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.error?.message || 'Không thể tải danh sách lịch hẹn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from appointments
  const calculateStats = (appointmentsList) => {
    const newStats = {
      total: appointmentsList.length,
      booked: appointmentsList.filter(a => a.status === 'booked').length,
      checkedIn: appointmentsList.filter(a => a.status === 'checked_in').length,
      completed: appointmentsList.filter(a => a.status === 'completed').length,
      cancelled: appointmentsList.filter(a => a.status === 'cancelled').length
    };
    setStats(newStats);
  };

  // Apply filters to appointments
  useEffect(() => {
    let filtered = [...appointments];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(apt => 
        new Date(apt.appointment_date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(apt => 
        new Date(apt.appointment_date) <= new Date(filters.dateTo)
      );
    }

    // Filter by doctor
    if (filters.doctorId !== 'all') {
      filtered = filtered.filter(apt => apt.doctor_id === parseInt(filters.doctorId));
    }

    // Filter by department
    if (filters.departmentId !== 'all') {
      filtered = filtered.filter(apt => apt.department_id === parseInt(filters.departmentId));
    }

    // Search by patient name or ID
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patient_name?.toLowerCase().includes(query) ||
        apt.patient_email?.toLowerCase().includes(query) ||
        apt.patient_phone?.includes(query) ||
        apt.appointment_id?.toString().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, filters]);

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      doctorId: 'all',
      departmentId: 'all',
      searchQuery: ''
    });
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thay đổi trạng thái thành "${getStatusLabel(newStatus)}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `http://localhost:5000/api/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Refresh appointments list
        await fetchAllAppointments();
        alert('Cập nhật trạng thái thành công!');
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert(err.response?.data?.error?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchAllAppointments();
        alert('Hủy lịch hẹn thành công!');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert(err.response?.data?.error?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      'booked': 'Đã đặt',
      'checked_in': 'Đã check-in',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
  };

  // Get status color class
  const getStatusClass = (status) => {
    const classes = {
      'booked': 'status-booked',
      'checked_in': 'status-checked-in',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classes[status] || '';
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllAppointments();
    }
  }, [user]);

  // Check role - Only Admin can access
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-appointments-container">
        <div className="access-denied">
          <h2>⛔ Không có quyền truy cập</h2>
          <p>Chỉ quản trị viên mới có thể quản lý toàn bộ lịch hẹn hệ thống.</p>
        </div>
      </div>
    );
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="admin-appointments-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appointments-container">
      {/* Header */}
      <div className="appointments-header">
        <div className="header-content">
          <h1>📅 Quản lý Lịch hẹn Toàn hệ thống</h1>
          <p>Quản lý và theo dõi tất cả lịch hẹn trong hệ thống</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-refresh"
            onClick={fetchAllAppointments}
            disabled={loading}
          >
            🔄 {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={fetchAllAppointments} className="btn-retry">
            Thử lại
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Tổng lịch hẹn</div>
          </div>
        </div>
        <div className="stat-card booked">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.booked}</div>
            <div className="stat-label">Đã đặt</div>
          </div>
        </div>
        <div className="stat-card checked-in">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.checkedIn}</div>
            <div className="stat-label">Đã check-in</div>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Hoàn thành</div>
          </div>
        </div>
        <div className="stat-card cancelled">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">Đã hủy</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>🔍 Bộ lọc</h3>
          <button className="btn-reset-filters" onClick={resetFilters}>
            🔄 Đặt lại bộ lọc
          </button>
        </div>
        
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group full-width">
            <label>🔍 Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo tên bệnh nhân, email, SĐT hoặc mã lịch hẹn..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>📊 Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="booked">Đã đặt</option>
              <option value="checked_in">Đã check-in</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Date From */}
          <div className="filter-group">
            <label>📅 Từ ngày</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="filter-group">
            <label>📅 Đến ngày</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div className="filter-group">
            <label>🏥 Chuyên khoa</label>
            <select
              value={filters.departmentId}
              onChange={(e) => handleFilterChange('departmentId', e.target.value)}
            >
              <option value="all">Tất cả chuyên khoa</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div className="filter-group">
            <label>👨‍⚕️ Bác sĩ</label>
            <select
              value={filters.doctorId}
              onChange={(e) => handleFilterChange('doctorId', e.target.value)}
            >
              <option value="all">Tất cả bác sĩ</option>
              {doctors.map(doctor => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  {doctor.degree} {doctor.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-results">
          <span>Hiển thị <strong>{filteredAppointments.length}</strong> / {appointments.length} lịch hẹn</span>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="appointments-table-section">
        {filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Không tìm thấy lịch hẹn</h3>
            <p>Không có lịch hẹn nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ngày khám</th>
                  <th>Giờ khám</th>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Chuyên khoa</th>
                  <th>Triệu chứng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.appointment_id}>
                    <td>#{appointment.appointment_id}</td>
                    <td>
                      {new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td>{appointment.time_slot}</td>
                    <td>
                      <div className="patient-cell">
                        <div className="patient-name">{appointment.patient_name}</div>
                        <div className="patient-contact">
                          📧 {appointment.patient_email}<br />
                          📱 {appointment.patient_phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="doctor-cell">
                        {appointment.doctor_degree} {appointment.doctor_name}
                      </div>
                    </td>
                    <td>{appointment.department_name}</td>
                    <td>
                      <div className="symptoms-cell">
                        {appointment.symptoms || <em>Không có</em>}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {appointment.status === 'booked' && (
                          <button
                            className="btn-action btn-checkin"
                            onClick={() => updateAppointmentStatus(appointment.appointment_id, 'checked_in')}
                            title="Check-in"
                          >
                            ✅
                          </button>
                        )}
                        {appointment.status === 'checked_in' && (
                          <button
                            className="btn-action btn-complete"
                            onClick={() => updateAppointmentStatus(appointment.appointment_id, 'completed')}
                            title="Hoàn thành"
                          >
                            ✔️
                          </button>
                        )}
                        {(appointment.status === 'booked' || appointment.status === 'checked_in') && (
                          <button
                            className="btn-action btn-cancel"
                            onClick={() => cancelAppointment(appointment.appointment_id)}
                            title="Hủy lịch hẹn"
                          >
                            ❌
                          </button>
                        )}
                        <button
                          className="btn-action btn-view"
                          onClick={() => window.open(`/appointment/${appointment.appointment_id}`, '_blank')}
                          title="Xem chi tiết"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointments;
