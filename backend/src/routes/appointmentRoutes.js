const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { completeAppointment } = require('../controllers/medicalRecordsController');
const { 
  verifyToken, 
  optionalAuth,
  requireRole,
  patientOnly,
  doctorOnly,
  receptionistOnly,
  staffOnly 
} = require('../middleware/authMiddleware');
const { globalRateLimit } = require('../middleware/rateLimitMiddleware');

/**
 * Appointment Routes with Authentication Middleware
 * Configures appointment endpoints with proper authentication and role-based access control
 * 
 * Task 5.3: Apply authentication middleware to protected endpoints
 * 
 * Public Routes (no authentication required):
 * - GET /api/appointments/doctors - Get doctors and departments for booking
 * 
 * Protected Routes (authentication required):
 * - POST /api/appointments/create - Create new appointment (patients only)
 * - GET /api/appointments/patient/:patientId - Get patient appointments (patient/staff only)
 * - POST /api/appointments/checkin - Check-in appointment (receptionist/admin only)
 * - GET /api/appointments/queue/:doctorId - Get doctor queue (doctor/admin only)
 * 
 * Requirements validated: 8.1, 8.2, 8.3, 8.4
 */

// Public Routes (Requirement 8.2: Allow access to public endpoints without token)

/**
 * GET /api/appointments/doctors
 * Get list of doctors and departments for appointment booking
 * - Public access (no authentication required)
 * - Used by both authenticated and unauthenticated users
 * - Essential for the booking flow
 * 
 * Validates Requirement 8.2: Public endpoints accessible without token
 */
router.get('/doctors', 
    globalRateLimit, // Basic rate limiting for public endpoint
    appointmentController.getDoctorsAndDepartments
);

// Protected Appointment Management Routes

/**
 * POST /api/appointments/create
 * Create new appointment booking
 * - Requires authentication (JWT token)
 * - Patient role preferred but allows all authenticated users
 * - Rate limited to prevent appointment spam
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects appointments endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 */
router.post('/create', 
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    globalRateLimit,
    appointmentController.createAppointment
);

/**
 * GET /api/appointments/patient/:patientId
 * Get appointments for a specific patient
 * - Requires authentication (JWT token)
 * - Patients can only access their own appointments
 * - Staff (doctors, receptionists, admins) can access any patient's appointments
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects appointments endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 */
router.get('/patient/:patientId', 
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    // Note: Additional role checking is handled in controller to allow:
    // - Patients to access their own appointments
    // - Staff to access any patient's appointments
    appointmentController.getPatientAppointments
);

/**
 * POST /api/appointments/checkin
 * Check-in appointment using QR code
 * - Requires authentication (JWT token)
 * - Restricted to receptionist and admin roles
 * - Used for appointment check-in process
 * 
 * Validates Requirements:
 * - 8.1: Auth middleware protects appointments endpoints requiring authentication
 * - 8.3: Return 401 with "Token not provided" when no token
 * - 8.4: Return 401 with "Invalid token" when invalid token
 * - 3.3: Receptionist role access to check-in functionality
 * - 3.4: Admin role access to all functions
 */
router.post('/checkin', 
    verifyToken, // Validates Requirements 8.1, 8.3, 8.4
    requireRole(['receptionist', 'admin']), // Validates Requirements 3.3, 3.4
    globalRateLimit,
    appointmentController.checkInAppointment
);

/**
 * GET /api/appointments/queue/:doctorId
 * Get doctor's appointment queue
 * Use /api/queue/doctor/:doctorId instead
 */
// router.get('/queue/:doctorId', 
//     verifyToken,
//     requireRole(['doctor', 'admin']),
//     appointmentController.getDoctorQueue
// );

/**
 * PUT /api/appointments/:id/complete
 * Complete appointment (change status from checked_in to completed)
 * - Requires authentication (JWT token)
 * - Restricted to doctor role
 * - Doctor must have created a medical record before completing
 * 
 * Part of Medical Records System workflow
 * Requirements: 5.1, 5.2, 5.3, 5.4, 10.3
 */
router.put('/:id/complete', 
    doctorOnly,
    completeAppointment
);

module.exports = router;