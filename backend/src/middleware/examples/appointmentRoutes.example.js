/**
 * Example: How to integrate authentication middleware with appointment routes
 * This shows how the existing appointment system would be enhanced with authentication
 */

const express = require('express');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

// Mock controllers (these would be your actual controllers)
const appointmentController = {
  // Updated to use authenticated user context
  createAppointment: (req, res) => {
    // patient_id automatically populated from JWT token
    const appointmentData = {
      ...req.body,
      patient_id: req.user.userId // From JWT token
    };
    
    res.json({ 
      message: 'Appointment created',
      appointment: appointmentData,
      createdBy: req.user.fullName
    });
  },

  // Updated to filter by authenticated user
  getPatientAppointments: (req, res) => {
    // Only show appointments for the authenticated patient
    res.json({
      patient_id: req.user.userId,
      appointments: [
        // Filtered appointments for this patient only
      ]
    });
  },

  // Updated to filter by authenticated doctor
  getDoctorQueue: (req, res) => {
    // Only show appointments for the authenticated doctor
    res.json({
      doctor_id: req.user.userId,
      queue: [
        // Filtered appointments for this doctor only
      ]
    });
  },

  // Updated for receptionist check-in
  checkinAppointment: (req, res) => {
    res.json({
      message: 'Patient checked in',
      checkedInBy: req.user.fullName,
      timestamp: new Date().toISOString()
    });
  },

  // Admin-only appointment management
  getAllAppointments: (req, res) => {
    res.json({
      message: 'All appointments (admin view)',
      appointments: [
        // All appointments system-wide
      ],
      accessedBy: req.user.fullName
    });
  },

  // Public endpoint - no authentication required
  getDoctorsAndDepartments: (req, res) => {
    res.json({
      doctors: [
        // Public doctor information
      ],
      departments: [
        // Public department information
      ]
    });
  }
};

// PUBLIC ENDPOINTS - No authentication required
router.get('/doctors', appointmentController.getDoctorsAndDepartments);

// PATIENT ENDPOINTS - Requires patient authentication
router.post('/appointments', 
  authMiddleware.patientOnly, 
  appointmentController.createAppointment
);

router.get('/appointments/my', 
  authMiddleware.patientOnly, 
  appointmentController.getPatientAppointments
);

// DOCTOR ENDPOINTS - Requires doctor authentication
router.get('/doctor/queue', 
  authMiddleware.doctorOnly, 
  appointmentController.getDoctorQueue
);

// RECEPTIONIST ENDPOINTS - Requires receptionist authentication
router.post('/appointments/:id/checkin', 
  authMiddleware.receptionistOnly, 
  appointmentController.checkinAppointment
);

// ADMIN ENDPOINTS - Requires admin authentication
router.get('/appointments/all', 
  authMiddleware.adminOnly, 
  appointmentController.getAllAppointments
);

// STAFF ENDPOINTS - Requires doctor, receptionist, or admin
router.get('/appointments/staff-view', 
  authMiddleware.staffOnly, 
  (req, res) => {
    res.json({
      message: `Staff view for ${req.user.role}`,
      user: req.user.fullName
    });
  }
);

// MIXED AUTHENTICATION - Shows different content based on auth status
router.get('/appointments/summary', 
  authMiddleware.optionalAuth, 
  (req, res) => {
    if (req.user) {
      // Authenticated user - show personalized summary
      res.json({
        message: `Welcome back, ${req.user.fullName}`,
        role: req.user.role,
        hasUpcoming: true, // Check from database
        canBook: req.user.role === 'patient'
      });
    } else {
      // Anonymous user - show public summary
      res.json({
        message: 'Welcome to THCT Clinic',
        availableServices: ['General Medicine', 'Cardiology', 'Dermatology'],
        loginRequired: true
      });
    }
  }
);

// ERROR HANDLING EXAMPLE
router.use((error, req, res, next) => {
  // Handle authentication errors
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Authentication failed',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next(error);
});

module.exports = router;

// USAGE EXAMPLE IN MAIN APP:
// 
// const express = require('express');
// const appointmentRoutes = require('./routes/appointmentRoutes');
// const { securityMiddleware } = require('./middleware/securityMiddleware');
// 
// const app = express();
// 
// // Apply security headers
// app.use(securityMiddleware);
// 
// // Apply appointment routes with authentication
// app.use('/api', appointmentRoutes);
// 
// app.listen(3001, () => {
//   console.log('Server running with authentication middleware');
// });