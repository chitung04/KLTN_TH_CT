const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * Admin Routes
 * All routes require admin role authentication
 * 
 * Routes:
 * - GET /api/admin/audit-logs - Get audit logs with pagination
 * - GET /api/admin/security-statistics - Get security statistics
 * - GET /api/admin/failed-logins - Get recent failed login attempts
 * - GET /api/admin/locked-accounts - Get currently locked accounts
 * - POST /api/admin/unlock-account/:userId - Unlock a user account
 * - GET /api/admin/audit-statistics - Get audit statistics for charts
 * - GET /api/admin/suspicious-activities - Get suspicious activities
 * - GET /api/admin/logs-by-ip/:ipAddress - Get logs by IP address
 * - GET /api/admin/departments - Get all departments
 * - POST /api/admin/departments - Create department
 * - PUT /api/admin/departments/:id - Update department
 * - DELETE /api/admin/departments/:id - Delete department
 * - GET /api/admin/doctors - Get all doctors
 * - POST /api/admin/doctors - Create doctor profile
 * - PUT /api/admin/doctors/:id - Update doctor profile
 * 
 * Requirements: 10.6 - Admin security dashboard, 16.1-16.7 - Department Management, 17.1-17.7 - Doctor Management
 */

// Apply authentication and admin role check to all routes
router.use(verifyToken);
router.use(requireRole(['admin']));

// Department management (Requirements 16.1-16.7)
router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);
router.delete('/departments/:id', adminController.deleteDepartment);

// Doctor management (Requirements 17.1-17.7)
router.get('/doctors', adminController.getDoctors);
router.post('/doctors', adminController.createDoctor);
router.put('/doctors/:id', adminController.updateDoctor);

// Audit logs and security monitoring
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/security-statistics', adminController.getSecurityStatistics);
router.get('/failed-logins', adminController.getFailedLogins);
router.get('/locked-accounts', adminController.getLockedAccounts);
router.get('/audit-statistics', adminController.getAuditStatistics);
router.get('/suspicious-activities', adminController.getSuspiciousActivities);
router.get('/logs-by-ip/:ipAddress', adminController.getLogsByIP);

// Account management
router.post('/unlock-account/:userId', adminController.unlockAccount);

module.exports = router;
