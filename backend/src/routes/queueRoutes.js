const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { verifyToken, patientOnly, doctorOnly } = require('../middleware/authMiddleware');

/**
 * Queue Routes
 * Handles patient queue tracking and doctor queue management
 * 
 * Requirements Validation:
 * - Requirement 11: Queue Management After Check-In
 * - Requirement 12: Doctor Queue Viewing
 * - Custom: Real-time Queue Tracking for Patients
 */

/**
 * GET /api/queue/position/:appointmentId
 * Get current queue position for an appointment
 */
router.get('/position/:appointmentId',
    verifyToken,
    queueController.getQueuePosition
);

/**
 * GET /api/queue/doctor/:doctorId
 * Get doctor's queue (all checked-in patients)
 * Auth: Doctor only
 */
router.get('/doctor/:doctorId',
    doctorOnly,
    queueController.getQueueForDoctor
);

/**
 * GET /api/queue/stats/:doctorId
 * Get queue statistics for a doctor
 */
router.get('/stats/:doctorId',
    verifyToken,
    queueController.getQueueStats
);

/**
 * POST /api/queue/remove/:appointmentId
 * Remove appointment from queue (mark as completed)
 */
router.post('/remove/:appointmentId',
    doctorOnly,
    queueController.removeFromQueue
);

module.exports = router;
