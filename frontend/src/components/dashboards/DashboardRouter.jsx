import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import AdminDashboard from './AdminDashboard';
import './Dashboard.css';

/**
 * DashboardRouter Component - Routes users to role-specific dashboards
 * 
 * Automatically renders the appropriate dashboard based on user's role.
 * Handles loading states and fallback to login if user is not authenticated.
 * 
 * Requirements Validation:
 * - Requirement 3.1: Patient dashboard for booking and medical records
 * - Requirement 3.2: Doctor dashboard for queue and patient records
 * - Requirement 3.3: Receptionist dashboard for check-in and appointments
 * - Requirement 3.4: Admin dashboard for system management
 * 
 * @param {Object} props
 * @param {Function} props.onNavigate - Navigation callback to change pages
 */
const DashboardRouter = ({ onNavigate }) => {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải dashboard...</p>
      </div>
    );
  }

  // Not authenticated - should be caught by ProtectedRoute but handle anyway
  if (!user) {
    return (
      <div className="dashboard-error">
        <h3>Lỗi xác thực</h3>
        <p>Vui lòng đăng nhập để truy cập dashboard</p>
        <button onClick={() => onNavigate && onNavigate('home')}>
          Về trang chủ
        </button>
      </div>
    );
  }

  // Route to appropriate dashboard based on role
  switch (user.role) {
    case 'patient':
      return <PatientDashboard onNavigate={onNavigate} />;
    
    case 'doctor':
      return <DoctorDashboard onNavigate={onNavigate} />;
    
    case 'receptionist':
      return <ReceptionistDashboard onNavigate={onNavigate} />;
    
    case 'admin':
      return <AdminDashboard onNavigate={onNavigate} />;
    
    default:
      return (
        <div className="dashboard-error">
          <h3>Vai trò không hợp lệ</h3>
          <p>Vai trò "{user.role}" không được hỗ trợ</p>
          <button onClick={() => onNavigate && onNavigate('home')}>
            Về trang chủ
          </button>
        </div>
      );
  }
};

export default DashboardRouter;
