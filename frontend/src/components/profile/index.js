/**
 * Profile Management Components
 * 
 * This module provides a complete profile management system for THCT Clinic
 * with the following components:
 * 
 * - ProfileManager: Main container component that manages all profile views
 * - ProfileView: Read-only display of user profile information
 * - ProfileEdit: Editable form for updating user profile with validation
 * - ChangePassword: Secure password change with old password verification
 * 
 * Features:
 * - Integration with existing AuthContext
 * - Real-time validation and error handling
 * - Vietnamese language support
 * - Responsive design consistent with existing THCT Clinic components
 * - Accessibility compliance with ARIA labels
 * - Loading states and success feedback
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5 - Complete user profile management
 */

export { default as ProfileManager } from './ProfileManager';
export { default as ProfileView } from './ProfileView';
export { default as ProfileEdit } from './ProfileEdit';
export { default as ChangePassword } from './ChangePassword';

// Default export for convenience
export { default } from './ProfileManager';