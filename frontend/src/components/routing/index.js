/**
 * Routing Components Index
 * 
 * Exports routing-related components and utilities for THCT Clinic application
 */

import ProtectedRoute, { hasResourceAccess, ROLE_PERMISSIONS } from './ProtectedRoute';
import PublicRoute from './PublicRoute';

export {
  ProtectedRoute,
  PublicRoute,
  hasResourceAccess,
  ROLE_PERMISSIONS
};

export default ProtectedRoute;
