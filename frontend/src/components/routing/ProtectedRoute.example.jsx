/**
 * ProtectedRoute Usage Examples
 * 
 * This file demonstrates various ways to use the ProtectedRoute component
 * for implementing authentication and authorization in THCT Clinic application.
 */

import React from 'react';
import ProtectedRoute, { hasResourceAccess } from './ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// Example 1: Basic Protected Route (Any Authenticated User)
// ============================================================================

export const BasicProtectedRouteExample = () => {
  return (
    <ProtectedRoute>
      <div>
        <h1>Protected Page</h1>
        <p>Only authenticated users can see this content.</p>
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 2: Single Role Protection - Patient Only
// Validates Requirement 3.1
// ============================================================================

export const PatientOnlyExample = () => {
  return (
    <ProtectedRoute requiredRole="patient">
      <div>
        <h1>Patient Dashboard</h1>
        <p>Book appointments and view your medical records</p>
        {/* Patient booking and medical records components */}
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 3: Single Role Protection - Doctor Only
// Validates Requirement 3.2
// ============================================================================

export const DoctorOnlyExample = () => {
  return (
    <ProtectedRoute requiredRole="doctor">
      <div>
        <h1>Doctor Queue</h1>
        <p>View and manage your patient queue</p>
        {/* Doctor queue and patient records components */}
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 4: Single Role Protection - Receptionist Only
// Validates Requirement 3.3
// ============================================================================

export const ReceptionistOnlyExample = () => {
  return (
    <ProtectedRoute requiredRole="receptionist">
      <div>
        <h1>Check-in Management</h1>
        <p>Scan QR codes and manage appointments</p>
        {/* QR check-in and appointment management components */}
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 5: Single Role Protection - Admin Only
// Validates Requirement 3.4
// ============================================================================

export const AdminOnlyExample = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>
        <h1>Admin Dashboard</h1>
        <p>Manage system settings and users</p>
        {/* Admin management components */}
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 6: Multiple Roles (OR Logic) - Medical Staff
// ============================================================================

export const MedicalStaffExample = () => {
  return (
    <ProtectedRoute requiredRole={['doctor', 'receptionist', 'admin']}>
      <div>
        <h1>Medical Staff Portal</h1>
        <p>Access for doctors, receptionists, and administrators</p>
        {/* Medical staff specific features */}
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 7: Custom Fallback for Unauthenticated Users
// ============================================================================

export const CustomFallbackExample = () => {
  const customLoginPrompt = (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '12px'
    }}>
      <h2>🔐 Đăng nhập THCT Clinic</h2>
      <p>Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ</p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 30px',
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Đăng nhập ngay
      </button>
    </div>
  );

  return (
    <ProtectedRoute fallback={customLoginPrompt}>
      <div>Protected Content</div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 8: Custom Unauthorized Fallback (403)
// Validates Requirement 3.6
// ============================================================================

export const CustomUnauthorizedExample = () => {
  const customUnauthorized = (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: '#fff5f5',
      borderRadius: '12px',
      border: '2px solid #fc8181'
    }}>
      <h2>⛔ Truy cập bị từ chối</h2>
      <p>Bạn cần quyền quản trị viên để truy cập trang này</p>
      <button onClick={() => window.history.back()}>
        Quay lại
      </button>
    </div>
  );

  return (
    <ProtectedRoute 
      requiredRole="admin" 
      unauthorizedFallback={customUnauthorized}
    >
      <div>Admin Only Content</div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 9: With Callbacks for Events
// ============================================================================

export const CallbacksExample = () => {
  const handleAuthRequired = () => {
    console.log('User needs to authenticate');
    // Could open a login modal, redirect, etc.
  };

  const handleUnauthorized = (userRole, requiredRole) => {
    console.log(`User with role ${userRole} tried to access ${requiredRole} content`);
    // Could log to analytics, show notification, etc.
  };

  return (
    <ProtectedRoute 
      requiredRole="doctor"
      onAuthRequired={handleAuthRequired}
      onUnauthorized={handleUnauthorized}
    >
      <div>Doctor Content</div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 10: Disable Return URL Preservation
// ============================================================================

export const NoReturnUrlExample = () => {
  return (
    <ProtectedRoute preserveReturnUrl={false}>
      <div>
        <p>This page won't save return URL for post-login redirect</p>
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 11: Using Resource Access Helper Function
// ============================================================================

export const ResourceAccessExample = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>My Available Features</h2>
      {hasResourceAccess(user?.role, 'booking') && (
        <div>✅ Book Appointments</div>
      )}
      {hasResourceAccess(user?.role, 'doctor-queue') && (
        <div>✅ Doctor Queue</div>
      )}
      {hasResourceAccess(user?.role, 'qr-checkin') && (
        <div>✅ QR Check-in</div>
      )}
      {hasResourceAccess(user?.role, 'appointment-management') && (
        <div>✅ Appointment Management</div>
      )}
    </div>
  );
};

// ============================================================================
// Example 12: Nested Protected Routes with Different Role Requirements
// ============================================================================

export const NestedProtectedRoutesExample = () => {
  return (
    <ProtectedRoute>
      {/* First level: Any authenticated user */}
      <div>
        <h1>Dashboard</h1>
        
        {/* Second level: Admin only section */}
        <ProtectedRoute requiredRole="admin">
          <div style={{ background: '#fef5e7', padding: '20px', margin: '10px 0' }}>
            <h2>Admin Section</h2>
            <p>This is visible only to administrators</p>
          </div>
        </ProtectedRoute>

        {/* Medical staff section */}
        <ProtectedRoute requiredRole={['doctor', 'receptionist']}>
          <div style={{ background: '#e8f5e9', padding: '20px', margin: '10px 0' }}>
            <h2>Medical Staff Section</h2>
            <p>This is visible to doctors and receptionists</p>
          </div>
        </ProtectedRoute>

        {/* Public section for all authenticated users */}
        <div style={{ background: '#e3f2fd', padding: '20px', margin: '10px 0' }}>
          <h2>Profile</h2>
          <p>All authenticated users can see their profile</p>
        </div>
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 13: Conditional Rendering Based on Role
// ============================================================================

export const ConditionalRenderExample = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div>
        <h1>Welcome, {user?.fullName}</h1>
        
        {user?.role === 'patient' && (
          <div>
            <h2>Patient Features</h2>
            <button>Book Appointment</button>
            <button>View Medical Records</button>
          </div>
        )}

        {user?.role === 'doctor' && (
          <div>
            <h2>Doctor Features</h2>
            <button>View Queue</button>
            <button>Patient Records</button>
          </div>
        )}

        {user?.role === 'receptionist' && (
          <div>
            <h2>Receptionist Features</h2>
            <button>QR Check-in</button>
            <button>Manage Appointments</button>
          </div>
        )}

        {user?.role === 'admin' && (
          <div>
            <h2>Admin Features</h2>
            <button>User Management</button>
            <button>System Settings</button>
            <button>Reports</button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

// ============================================================================
// Example 14: Integration with Page-Based Navigation (Current THCT App Style)
// ============================================================================

export const PageBasedProtectionExample = ({ currentPage }) => {
  // Example of protecting different pages in the current THCT app structure
  
  if (currentPage === 'booking') {
    return (
      <ProtectedRoute requiredRole="patient">
        <div>Booking Page Content</div>
      </ProtectedRoute>
    );
  }

  if (currentPage === 'doctor-queue') {
    return (
      <ProtectedRoute requiredRole="doctor">
        <div>Doctor Queue Content</div>
      </ProtectedRoute>
    );
  }

  if (currentPage === 'qr-checkin') {
    return (
      <ProtectedRoute requiredRole={['receptionist', 'admin']}>
        <div>QR Check-in Content</div>
      </ProtectedRoute>
    );
  }

  if (currentPage === 'admin') {
    return (
      <ProtectedRoute requiredRole="admin">
        <div>Admin Panel Content</div>
      </ProtectedRoute>
    );
  }

  // Public page
  return <div>Public Home Page</div>;
};

export default {
  BasicProtectedRouteExample,
  PatientOnlyExample,
  DoctorOnlyExample,
  ReceptionistOnlyExample,
  AdminOnlyExample,
  MedicalStaffExample,
  CustomFallbackExample,
  CustomUnauthorizedExample,
  CallbacksExample,
  NoReturnUrlExample,
  ResourceAccessExample,
  NestedProtectedRoutesExample,
  ConditionalRenderExample,
  PageBasedProtectionExample
};
