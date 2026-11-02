import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './SecurityDashboard.css';

/**
 * SecurityDashboard Component
 * Admin security monitoring dashboard for authentication system
 * 
 * Features:
 * - Recent login attempts (successful and failed)
 * - Locked accounts management
 * - Login patterns and security metrics
 * - Real-time alerts for suspicious activities
 * - IP-based activity tracking
 * 
 * Requirements Validation: 10.6 - Admin security dashboard for monitoring
 */
const SecurityDashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [statistics, setStatistics] = useState({
    todayLogins: 0,
    failedAttempts: 0,
    lockedAccounts: 0,
    suspiciousActivities: 0
  });
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSecurityData();
  }, [timeRange]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch audit logs
      const logsResponse = await fetch('/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAuditLogs(logsData.data || []);
      }

      // Fetch statistics
      const statsResponse = await fetch('/api/admin/security-statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.statistics || statistics);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setError('Không thể tải dữ liệu bảo mật');
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    const icons = {
      'login': '✅',
      'login_failed': '❌',
      'logout': '👋',
      'register': '📝',
      'register_failed': '⚠️',
      'password_change': '🔑',
      'password_reset_request': '🔐',
      'password_reset': '🔓',
      'profile_update': '✏️',
      'role_change': '👑',
      'suspicious_activity': '🚨'
    };
    return icons[action] || '📊';
  };

  const getActionLabel = (action) => {
    const labels = {
      'login': 'Đăng nhập',
      'login_failed': 'Đăng nhập thất bại',
      'logout': 'Đăng xuất',
      'register': 'Đăng ký',
      'register_failed': 'Đăng ký thất bại',
      'password_change': 'Đổi mật khẩu',
      'password_reset_request': 'Yêu cầu đặt lại mật khẩu',
      'password_reset': 'Đặt lại mật khẩu',
      'profile_update': 'Cập nhật hồ sơ',
      'role_change': 'Thay đổi vai trò',
      'suspicious_activity': 'Hoạt động đáng ngờ'
    };
    return labels[action] || action;
  };

  const getStatusClass = (success) => {
    return success ? 'status-success' : 'status-failed';
  };

  if (loading) {
    return (
      <div className="security-dashboard">
        <div className="dashboard-header">
          <h2>🔒 Giám sát bảo mật</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu bảo mật...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="security-dashboard">
        <div className="dashboard-header">
          <h2>🔒 Giám sát bảo mật</h2>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchSecurityData} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h2>🔒 Giám sát bảo mật</h2>
          <p>Theo dõi hoạt động đăng nhập và bảo mật hệ thống</p>
        </div>
        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="24h">24 giờ qua</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
          </select>
          <button onClick={fetchSecurityData} className="btn-refresh">
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="security-stats">
        <div className="stat-card">
          <div className="stat-icon success">✅</div>
          <div className="stat-content">
            <div className="stat-value">{statistics.todayLogins}</div>
            <div className="stat-label">Đăng nhập hôm nay</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">❌</div>
          <div className="stat-content">
            <div className="stat-value">{statistics.failedAttempts}</div>
            <div className="stat-label">Lần đăng nhập thất bại</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">🔒</div>
          <div className="stat-content">
            <div className="stat-value">{statistics.lockedAccounts}</div>
            <div className="stat-label">Tài khoản bị khóa</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon alert">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{statistics.suspiciousActivities}</div>
            <div className="stat-label">Hoạt động đáng ngờ</div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="audit-logs-section">
        <h3>📋 Nhật ký kiểm toán</h3>
        
        {auditLogs.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <p>Không có dữ liệu nhật ký trong khoảng thời gian này</p>
          </div>
        ) : (
          <div className="audit-table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                  <th>Người dùng</th>
                  <th>Địa chỉ IP</th>
                  <th>Trạng thái</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.log_id}>
                    <td className="timestamp-cell">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="action-cell">
                      <span className="action-icon">{getActionIcon(log.action)}</span>
                      <span className="action-label">{getActionLabel(log.action)}</span>
                    </td>
                    <td className="user-cell">
                      {log.user_id ? `User #${log.user_id}` : 'N/A'}
                    </td>
                    <td className="ip-cell">
                      <code>{log.ip_address}</code>
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${getStatusClass(log.success)}`}>
                        {log.success ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="details-cell">
                      {log.failure_reason ? (
                        <span className="failure-reason" title={log.failure_reason}>
                          {log.failure_reason.substring(0, 50)}
                          {log.failure_reason.length > 50 ? '...' : ''}
                        </span>
                      ) : (
                        <span className="no-details">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Alerts */}
      <div className="security-alerts">
        <h3>🚨 Cảnh báo bảo mật</h3>
        <div className="alerts-list">
          {statistics.failedAttempts > 10 && (
            <div className="alert alert-danger">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <div className="alert-title">Nhiều lần đăng nhập thất bại</div>
                <div className="alert-message">
                  Phát hiện {statistics.failedAttempts} lần đăng nhập thất bại trong {timeRange === '24h' ? '24 giờ' : timeRange === '7d' ? '7 ngày' : '30 ngày'} qua
                </div>
              </div>
            </div>
          )}

          {statistics.lockedAccounts > 0 && (
            <div className="alert alert-warning">
              <span className="alert-icon">🔒</span>
              <div className="alert-content">
                <div className="alert-title">Tài khoản bị khóa</div>
                <div className="alert-message">
                  Có {statistics.lockedAccounts} tài khoản đang bị khóa do đăng nhập sai quá nhiều lần
                </div>
              </div>
            </div>
          )}

          {statistics.suspiciousActivities > 0 && (
            <div className="alert alert-critical">
              <span className="alert-icon">🚨</span>
              <div className="alert-content">
                <div className="alert-title">Hoạt động đáng ngờ</div>
                <div className="alert-message">
                  Phát hiện {statistics.suspiciousActivities} hoạt động đáng ngờ cần xem xét
                </div>
              </div>
            </div>
          )}

          {statistics.failedAttempts <= 10 && 
           statistics.lockedAccounts === 0 && 
           statistics.suspiciousActivities === 0 && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              <div className="alert-content">
                <div className="alert-title">Hệ thống an toàn</div>
                <div className="alert-message">
                  Không phát hiện hoạt động bất thường trong khoảng thời gian này
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
