import React, { useState } from 'react';
import ProfileView from './ProfileView';
import ProfileEdit from './ProfileEdit';
import ChangePassword from './ChangePassword';
import './Profile.css';

/**
 * ProfileManager Component - Main container for profile management
 * 
 * Features:
 * - Manages state between ProfileView, ProfileEdit, and ChangePassword components
 * - Provides smooth transitions between different views
 * - Handles navigation and data flow between components
 * - Responsive design consistent with existing auth components
 * - Vietnamese language support
 * 
 * This component serves as the main entry point for user profile management,
 * integrating all profile-related functionality in one cohesive interface.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5 - Complete profile management system
 */
const ProfileManager = () => {
  const [currentView, setCurrentView] = useState('view'); // 'view', 'edit', 'changePassword'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle switching to edit mode
  const handleEditClick = () => {
    setCurrentView('edit');
  };

  // Handle switching to change password mode
  const handleChangePasswordClick = () => {
    setCurrentView('changePassword');
  };

  // Handle successful profile save
  const handleProfileSave = (updatedUser) => {
    setCurrentView('view');
    // Trigger a refresh of the profile data
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle successful password change
  const handlePasswordChangeSuccess = () => {
    setCurrentView('view');
  };

  // Handle cancel actions
  const handleCancel = () => {
    setCurrentView('view');
  };

  // Render the appropriate component based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'edit':
        return (
          <ProfileEdit
            onSave={handleProfileSave}
            onCancel={handleCancel}
            key={`edit-${refreshTrigger}`}
          />
        );
      
      case 'changePassword':
        return (
          <ChangePassword
            onSuccess={handlePasswordChangeSuccess}
            onCancel={handleCancel}
          />
        );
      
      case 'view':
      default:
        return (
          <ProfileView
            onEditClick={handleEditClick}
            onChangePasswordClick={handleChangePasswordClick}
            key={`view-${refreshTrigger}`}
          />
        );
    }
  };

  return (
    <div className="profile-manager">
      {renderCurrentView()}
    </div>
  );
};

export default ProfileManager;