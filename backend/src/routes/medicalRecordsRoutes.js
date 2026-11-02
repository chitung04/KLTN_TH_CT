const express = require('express');
const router = express.Router();
const medicalRecordsController = require('../controllers/medicalRecordsController');
const { doctorOnly, patientOnly, receptionistOnly, verifyToken } = require('../middleware/authMiddleware');

/**
 * Medical Records Routes
 * All routes require authentication via verifyToken middleware
 * Role-specific access enforced via doctorOnly, patientOnly, receptionistOnly
 */

// ============================================
// Doctor Endpoints
// ============================================

/**
 * GET /api/medical-records/checked-in
 * Get list of patients who have checked-in and are waiting for examination
 * Auth: Doctor only
 */
router.get('/checked-in', doctorOnly, medicalRecordsController.getCheckedInPatients);

/**
 * POST /api/medical-records
 * Create a new medical record for a checked-in appointment
 * Auth: Doctor only
 */
router.post('/', doctorOnly, medicalRecordsController.createMedicalRecord);

/**
 * POST /api/medical-records/:id/prescriptions
 * Create prescriptions for a medical record
 * Auth: Doctor only
 */
router.post('/:id/prescriptions', doctorOnly, medicalRecordsController.createPrescriptions);

/**
 * PUT /api/medical-records/:id/reexamination
 * Update reexamination date for a medical record
 * Auth: Doctor only
 */
router.put('/:id/reexamination', doctorOnly, medicalRecordsController.updateReexaminationDate);

// ============================================
// Patient Endpoints
// ============================================

/**
 * GET /api/medical-records/patient/history
 * Get authenticated patient's medical history
 * Auth: Patient only
 */
router.get('/patient/history', patientOnly, medicalRecordsController.getPatientMedicalHistory);

// ============================================
// Shared Endpoints (Multiple Roles)
// ============================================

/**
 * GET /api/medical-records/:id/prescriptions
 * Get prescriptions for a medical record
 * Auth: Patient (own records), Doctor (own records), Receptionist (any)
 */
router.get('/:id/prescriptions', verifyToken, medicalRecordsController.getPrescriptions);

/**
 * GET /api/medical-records/:id
 * Get detailed information about a medical record
 * Auth: Patient (own records), Doctor (own records), Receptionist (any)
 * 
 * Note: This route must come AFTER the /patient/history route to avoid route conflict
 */
router.get('/:id', verifyToken, medicalRecordsController.getMedicalRecordDetails);

// ============================================
// Receptionist Endpoints
// ============================================

/**
 * GET /api/medical-records/patient/:patientId
 * Get all medical records for a specific patient
 * Auth: Receptionist only
 */
router.get('/patient/:patientId', receptionistOnly, medicalRecordsController.getPatientRecordsByReceptionist);

module.exports = router;
