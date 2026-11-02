import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PatientDashboard from '../dashboards/PatientDashboard';
import DoctorDashboard from '../dashboards/DoctorDashboard';
import ReceptionistDashboard from '../dashboards/ReceptionistDashboard';
import AdminDashboard from '../dashboards/AdminDashboard';
import './DashboardRouter.css';

/**
 * DashboardRouter Component - Role-Based Dashboard Routing
 * 
 * Routes users to appropriate dashboard based on their role after successful login.
 * Supports 4 user roles with distinct dashboards:
 * - Patient: Booking, appointments, medical records
 * - Doctor: Queue, schedule, patient records
 * - Receptionist: Check-in, appointment management
 * - Admin: System-wide management functions
 * 
 * Requirements Validation:
 * - Requirement 3.1: Patient dashboard with booking and medical records access
 * - Requirement 3.2: Doctor dashboard with queue and patient records
 * - Requirement 3.3: Receptionist dashboard with QR check-in and appointment management
 * - Requirement 3.4: Admin dashboard with all system functions
 * 
 * @param {Object} props
 * @param {Function} props.onNavigate - Callback to handle page navigation in App.js
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

  // User not authenticated (shouldn't reach here due to ProtectedRoute, but safety check)
  if (!user) {
    return (
      <div className="dashboard-error">
        <h3>⚠️ Lỗi xác thực</h3>
        <p>Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.</p>
      </div>
    );
  }

  // Route to role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'patient':
        return <PatientDashboard user={user} onNavigate={onNavigate} />;
      
      case 'doctor':
        return <DoctorDashboard user={user} onNavigate={onNavigate} />;
      
      case 'receptionist':
        return <ReceptionistDashboard user={user} onNavigate={onNavigate} />;
      
      case 'admin':
        return <AdminDashboard user={user} onNavigate={onNavigate} />;
      
      default:
        return (
          <div className="dashboard-error">
            <h3>⚠️ Vai trò không hợp lệ</h3>
            <p>Vai trò "{user.role}" không được hỗ trợ trong hệ thống.</p>
            <p>Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-router">
      {renderDashboard()}
    </div>
  );
};

export default DashboardRouter;
