import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

/**
 * UserManagement Component
 * Admin can view all users, add new users, and change user roles
 */
const UserManagement = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Form state for adding new user
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '', // Changed from phoneNumber to phone
    role: 'patient',
    dateOfBirth: '',
    gender: 'male',
    address: ''
  });

  const roles = [
    { value: 'patient', label: 'Bệnh nhân', icon: '👤', color: '#10b981' },
    { value: 'doctor', label: 'Bác sĩ', icon: '👨‍⚕️', color: '#3b82f6' },
    { value: 'receptionist', label: 'Lễ tân', icon: '💁‍♀️', color: '#f59e0b' },
    { value: 'admin', label: 'Quản trị viên', icon: '👨‍💼', color: '#ef4444' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/users/manage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.data?.users || response.data.users || []);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Use public register endpoint (no token needed for registration)
      const response = await axios.post(
        `${API_BASE}/auth/register`,
        newUser
      );

      if (response.data.success) {
        alert('Thêm người dùng thành công!');
        setShowAddModal(false);
        setNewUser({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          role: 'patient',
          dateOfBirth: '',
          gender: 'male',
          address: ''
        });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.response?.data?.message || 'Không thể thêm người dùng');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`Xác nhận thay đổi quyền người dùng thành "${roles.find(r => r.value === newRole)?.label}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${API_BASE}/users/${userId}/role`,
        { newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Cập nhật quyền thành công!');
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật quyền');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete(
        `${API_BASE}/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Xóa người dùng thành công!');
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[0];
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="loading-container">Đang tải...</div>;
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div>
          <button className="btn-back" onClick={onBack}>
            ← Quay lại
          </button>
          <h1>Quản lý người dùng</h1>
          <p>Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
        <button className="btn-add-user" onClick={() => setShowAddModal(true)}>
          <span>+</span> Thêm người dùng
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="user-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="role-filters">
          <button 
            className={`filter-btn ${filterRole === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRole('all')}
          >
            Tất cả ({users.length})
          </button>
          {roles.map(role => (
            <button
              key={role.value}
              className={`filter-btn ${filterRole === role.value ? 'active' : ''}`}
              onClick={() => setFilterRole(role.value)}
              style={{ borderColor: role.color }}
            >
              {role.icon} {role.label} ({users.filter(u => u.role === role.value).length})
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small" style={{ backgroundColor: roleInfo.color }}>
                          {user.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.fullName}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || user.phoneNumber || '-'}</td>
                    <td>
                      <div className="role-badge" style={{ backgroundColor: `${roleInfo.color}15`, color: roleInfo.color }}>
                        {roleInfo.icon} {roleInfo.label}
                      </div>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="action-buttons">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className="role-select"
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.icon} {role.label}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Xóa người dùng"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm người dùng mới</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser} className="add-user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    required
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mật khẩu *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    placeholder="Tối thiểu 8 ký tự"
                    minLength="8"
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    required
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    value={newUser.gender}
                    onChange={(e) => setNewUser({...newUser, gender: e.target.value})}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  value={newUser.dateOfBirth}
                  onChange={(e) => setNewUser({...newUser, dateOfBirth: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea
                  value={newUser.address}
                  onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                  placeholder="Nhập địa chỉ"
                  rows="2"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  Thêm người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
