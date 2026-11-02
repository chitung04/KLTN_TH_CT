import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminStatistics.css';

/**
 * AdminStatistics Component
 * Comprehensive statistics dashboard for administrators
 * 
 * Requirements:
 * - Requirement 18: Appointment Statistics Reporting
 * - Requirement 19: No-Show Rate Reporting
 */
const AdminStatistics = ({ onBack }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [noShowStats, setNoShowStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'appointments', 'no-show'
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    department_id: '',
    doctor_id: ''
  });

  // Fetch dashboard overview
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/statistics/dashboard',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
      setError(err.response?.data?.error?.message || 'Lỗi khi tải dữ liệu tổng quan');
    }
  };

  // Fetch appointment statistics
  const fetchAppointmentStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.department_id) params.append('department_id', filters.department_id);
      if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);

      const response = await axios.get(
        `http://localhost:5000/api/statistics/appointments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setAppointmentStats(response.data.data);
      }
    } catch (err) {
      console.error('Fetch appointment stats error:', err);
      setError(err.response?.data?.error?.message || 'Lỗi khi tải thống kê lịch hẹn');
    }
  };

  // Fetch no-show statistics
  const fetchNoShowStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.department_id) params.append('department_id', filters.department_id);
      if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);

      const response = await axios.get(
        `http://localhost:5000/api/statistics/no-show?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setNoShowStats(response.data.data);
      }
    } catch (err) {
      console.error('Fetch no-show stats error:', err);
      setError(err.response?.data?.error?.message || 'Lỗi khi tải thống kê không đến khám');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await fetchDashboardData();
      
      if (activeTab === 'appointments') {
        await fetchAppointmentStats();
      } else if (activeTab === 'no-show') {
        await fetchNoShowStats();
      }
      
      setLoading(false);
    };

    loadData();
  }, [activeTab, filters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      department_id: '',
      doctor_id: ''
    });
  };

  // Render Overview Tab
  const renderOverview = () => {
    if (!dashboardData) return null;

    const { today, thisMonth, users, doctors, departments } = dashboardData;

    return (
      <div className="overview-section">
        {/* Today's Stats */}
        <div className="stats-section">
          <h3>📊 Thống kê hôm nay</h3>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{today.total_today || 0}</div>
                <div className="stat-label">Tổng lịch hẹn</div>
              </div>
            </div>

            <div className="stat-card yellow">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{today.booked || 0}</div>
                <div className="stat-label">Đã đặt</div>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{today.checked_in || 0}</div>
                <div className="stat-label">Đã check-in</div>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✔️</div>
              <div className="stat-content">
                <div className="stat-value">{today.completed || 0}</div>
                <div className="stat-label">Hoàn thành</div>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-value">{today.cancelled || 0}</div>
                <div className="stat-label">Đã hủy</div>
              </div>
            </div>
          </div>
        </div>

        {/* This Month's Stats */}
        <div className="stats-section">
          <h3>📆 Thống kê tháng này</h3>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{thisMonth.total_month || 0}</div>
                <div className="stat-label">Tổng lịch hẹn</div>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{thisMonth.completed || 0}</div>
                <div className="stat-label">Hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="stats-section">
          <h3>🏥 Thông tin hệ thống</h3>
          <div className="stats-grid">
            <div className="stat-card purple">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">
                  {users.reduce((sum, u) => sum + u.count, 0)}
                </div>
                <div className="stat-label">Tổng người dùng</div>
              </div>
            </div>

            <div className="stat-card blue">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-content">
                <div className="stat-value">{doctors || 0}</div>
                <div className="stat-label">Bác sĩ</div>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">🏥</div>
              <div className="stat-content">
                <div className="stat-value">{departments || 0}</div>
                <div className="stat-label">Chuyên khoa</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="stats-section">
          <h3>👥 Phân bố người dùng</h3>
          <div className="user-distribution">
            {users.map((user, idx) => (
              <div key={idx} className="user-role-item">
                <div className="role-info">
                  <span className="role-name">
                    {user.role === 'patient' && '👤 Bệnh nhân'}
                    {user.role === 'doctor' && '👨‍⚕️ Bác sĩ'}
                    {user.role === 'receptionist' && '👔 Lễ tân'}
                    {user.role === 'admin' && '👑 Quản trị viên'}
                  </span>
                  <span className="role-count">{user.count} người</span>
                </div>
                <div className="role-bar">
                  <div 
                    className="role-bar-fill"
                    style={{ 
                      width: `${(user.count / users.reduce((sum, u) => sum + u.count, 0)) * 100}%`,
                      backgroundColor: user.role === 'patient' ? '#3b82f6' : 
                                      user.role === 'doctor' ? '#10b981' :
                                      user.role === 'receptionist' ? '#f59e0b' : '#8b5cf6'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Appointment Statistics Tab
  const renderAppointmentStats = () => {
    if (!appointmentStats) return <div className="loading">Đang tải...</div>;

    const { summary, byStatus, byDepartment, byDoctor } = appointmentStats;

    return (
      <div className="appointment-stats-section">
        {/* Summary */}
        <div className="stats-summary">
          <h3>📊 Tổng quan</h3>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{summary.totalAppointments}</div>
                <div className="stat-label">Tổng lịch hẹn</div>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-value">{summary.averagePerDay.toFixed(1)}</div>
                <div className="stat-label">Trung bình/ngày</div>
              </div>
            </div>
          </div>
        </div>

        {/* By Status */}
        <div className="stats-table">
          <h3>📊 Theo trạng thái</h3>
          <table>
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th>Số lượng</th>
                <th>Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {byStatus.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    {item.status === 'booked' && '📋 Đã đặt'}
                    {item.status === 'checked_in' && '✅ Đã check-in'}
                    {item.status === 'completed' && '✔️ Hoàn thành'}
                    {item.status === 'cancelled' && '❌ Đã hủy'}
                  </td>
                  <td>{item.count}</td>
                  <td>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                      <span>{item.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Department */}
        <div className="stats-table">
          <h3>🏥 Theo chuyên khoa</h3>
          <table>
            <thead>
              <tr>
                <th>Chuyên khoa</th>
                <th>Số lượng</th>
                <th>Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.departmentName}</td>
                  <td>{item.count}</td>
                  <td>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                      <span>{item.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Doctor */}
        <div className="stats-table">
          <h3>👨‍⚕️ Theo bác sĩ</h3>
          <table>
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Khoa</th>
                <th>Tổng</th>
                <th>Hoàn thành</th>
                <th>Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {byDoctor.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.doctorName}</td>
                  <td>{item.departmentName}</td>
                  <td>{item.totalAppointments}</td>
                  <td>{item.completedAppointments}</td>
                  <td>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill green"
                        style={{ width: `${item.completionRate}%` }}
                      ></div>
                      <span>{item.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render No-Show Statistics Tab
  const renderNoShowStats = () => {
    if (!noShowStats) return <div className="loading">Đang tải...</div>;

    const { summary, byDoctor, byDepartment } = noShowStats;

    return (
      <div className="no-show-stats-section">
        {/* Summary */}
        <div className="stats-summary">
          <h3>📊 Tổng quan không đến khám</h3>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{summary.totalPastAppointments}</div>
                <div className="stat-label">Tổng lịch hẹn</div>
              </div>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-value">{summary.noShows}</div>
                <div className="stat-label">Không đến</div>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{summary.attended}</div>
                <div className="stat-label">Đã đến</div>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{summary.attendanceRate}%</div>
                <div className="stat-label">Tỷ lệ đến khám</div>
              </div>
            </div>
          </div>
        </div>

        {/* By Department */}
        <div className="stats-table">
          <h3>🏥 Theo chuyên khoa</h3>
          <table>
            <thead>
              <tr>
                <th>Chuyên khoa</th>
                <th>Tổng</th>
                <th>Không đến</th>
                <th>Tỷ lệ không đến</th>
                <th>Tỷ lệ đến khám</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.departmentName}</td>
                  <td>{item.totalAppointments}</td>
                  <td>{item.noShows}</td>
                  <td>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill red"
                        style={{ width: `${item.noShowRate}%` }}
                      ></div>
                      <span>{item.noShowRate}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill green"
                        style={{ width: `${item.attendanceRate}%` }}
                      ></div>
                      <span>{item.attendanceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Doctor */}
        <div className="stats-table">
          <h3>👨‍⚕️ Theo bác sĩ</h3>
          <table>
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Khoa</th>
                <th>Tổng</th>
                <th>Không đến</th>
                <th>Tỷ lệ không đến</th>
              </tr>
            </thead>
            <tbody>
              {byDoctor.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.doctorName}</td>
                  <td>{item.departmentName}</td>
                  <td>{item.totalAppointments}</td>
                  <td>{item.noShows}</td>
                  <td>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill red"
                        style={{ width: `${item.noShowRate}%` }}
                      ></div>
                      <span>{item.noShowRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="admin-statistics-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-statistics-container">
      {/* Header */}
      <div className="stats-header">
        <div>
          <h1>📊 Thống kê & Báo cáo</h1>
          <p>Tổng quan hoạt động của hệ thống</p>
        </div>
        {onBack && (
          <button className="btn-back" onClick={onBack}>
            ← Quay lại
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="stats-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Tổng quan
        </button>
        <button 
          className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Lịch hẹn
        </button>
        <button 
          className={`tab ${activeTab === 'no-show' ? 'active' : ''}`}
          onClick={() => setActiveTab('no-show')}
        >
          ❌ Không đến khám
        </button>
      </div>

      {/* Filters (for appointments and no-show tabs) */}
      {(activeTab === 'appointments' || activeTab === 'no-show') && (
        <div className="stats-filters">
          <div className="filter-group">
            <label>Từ ngày:</label>
            <input 
              type="date" 
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Đến ngày:</label>
            <input 
              type="date" 
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
            />
          </div>
          <button className="btn-clear-filters" onClick={clearFilters}>
            🔄 Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Content */}
      <div className="stats-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'appointments' && renderAppointmentStats()}
        {activeTab === 'no-show' && renderNoShowStats()}
      </div>
    </div>
  );
};

export default AdminStatistics;
