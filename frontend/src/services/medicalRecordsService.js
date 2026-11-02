import axios from 'axios';

/**
 * Medical Records Service
 * 
 * Provides API functions for medical records management system.
 * All functions include JWT authentication via Authorization header.
 * 
 * API Base URL: http://localhost:5000
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MEDICAL_RECORDS_API = `${API_BASE_URL}/api/medical-records`;
const APPOINTMENTS_API = `${API_BASE_URL}/api/appointments`;

/**
 * Get authorization header with JWT token
 * @returns {Object} Headers object with Authorization
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Doctor Workflow APIs
 */

/**
 * Get list of checked-in patients for the authenticated doctor
 * @returns {Promise<Array>} List of checked-in patients with appointment details
 */
export const getCheckedInPatients = async () => {
  try {
    const response = await axios.get(
      `${MEDICAL_RECORDS_API}/checked-in`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching checked-in patients:', error);
    throw error.response?.data || error;
  }
};

/**
 * Create a new medical record for a patient
 * @param {Object} data - Medical record data
 * @param {number} data.appointment_id - Appointment ID
 * @param {string} data.symptoms - Patient symptoms
 * @param {string} data.diagnosis - Doctor's diagnosis
 * @param {string} data.note - Additional notes (optional)
 * @param {string} data.reexamination_date - Reexamination date (optional, YYYY-MM-DD)
 * @returns {Promise<Object>} Created medical record with ID
 */
export const createMedicalRecord = async (data) => {
  try {
    const response = await axios.post(
      MEDICAL_RECORDS_API,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating medical record:', error);
    throw error.response?.data || error;
  }
};

/**
 * Create prescriptions for a medical record
 * @param {number} medicalRecordId - Medical record ID
 * @param {Array} prescriptions - Array of prescription objects
 * @param {string} prescriptions[].medicine_name - Medicine name
 * @param {string} prescriptions[].dosage - Dosage instructions
 * @param {number} prescriptions[].quantity - Quantity
 * @param {string} prescriptions[].instructions - Usage instructions (optional)
 * @returns {Promise<Object>} Created prescriptions with IDs
 */
export const createPrescriptions = async (medicalRecordId, prescriptions) => {
  try {
    const response = await axios.post(
      `${MEDICAL_RECORDS_API}/${medicalRecordId}/prescriptions`,
      { prescriptions },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating prescriptions:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update reexamination date for a medical record
 * @param {number} medicalRecordId - Medical record ID
 * @param {string|null} reexaminationDate - Reexamination date (YYYY-MM-DD) or null
 * @returns {Promise<Object>} Updated medical record
 */
export const updateReexaminationDate = async (medicalRecordId, reexaminationDate) => {
  try {
    const response = await axios.put(
      `${MEDICAL_RECORDS_API}/${medicalRecordId}/reexamination`,
      { reexamination_date: reexaminationDate },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating reexamination date:', error);
    throw error.response?.data || error;
  }
};

/**
 * Complete an appointment (mark as completed)
 * @param {number} appointmentId - Appointment ID
 * @returns {Promise<Object>} Updated appointment
 */
export const completeAppointment = async (appointmentId) => {
  try {
    const response = await axios.put(
      `${APPOINTMENTS_API}/${appointmentId}/complete`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error completing appointment:', error);
    throw error.response?.data || error;
  }
};

/**
 * Patient Workflow APIs
 */

/**
 * Get medical history for the authenticated patient
 * @returns {Promise<Array>} List of medical records with appointment details
 */
export const getPatientMedicalHistory = async () => {
  try {
    const response = await axios.get(
      `${MEDICAL_RECORDS_API}/patient/history`,
      { headers: getAuthHeader() }
    );
    
    // Extract data from response
    if (response.data && response.data.success) {
      return response.data.data || response.data.medicalRecords || [];
    }
    
    // If response.data is already an array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Default to empty array
    return [];
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    
    // Return empty array on error instead of throwing
    if (error.response?.status === 404) {
      return [];
    }
    
    throw {
      message: error.response?.data?.message || 'Không thể tải hồ sơ y tế. Vui lòng thử lại sau.',
      status: error.response?.status
    };
  }
};

/**
 * Get details of a specific medical record
 * @param {number} medicalRecordId - Medical record ID
 * @returns {Promise<Object>} Medical record details with appointment info
 */
export const getMedicalRecordDetails = async (medicalRecordId) => {
  try {
    const response = await axios.get(
      `${MEDICAL_RECORDS_API}/${medicalRecordId}`,
      { headers: getAuthHeader() }
    );
    
    // Extract data from response
    if (response.data && response.data.success) {
      return response.data.data || response.data.medicalRecord || response.data;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching medical record details:', error);
    throw {
      message: error.response?.data?.message || 'Không thể tải chi tiết hồ sơ. Vui lòng thử lại sau.',
      status: error.response?.status
    };
  }
};

/**
 * Get prescriptions for a medical record
 * @param {number} medicalRecordId - Medical record ID
 * @returns {Promise<Array>} List of prescriptions
 */
export const getPrescriptions = async (medicalRecordId) => {
  try {
    const response = await axios.get(
      `${MEDICAL_RECORDS_API}/${medicalRecordId}/prescriptions`,
      { headers: getAuthHeader() }
    );
    
    // Extract data from response
    if (response.data && response.data.success) {
      return response.data.data || response.data.prescriptions || [];
    }
    
    // If response.data is already an array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Default to empty array
    return [];
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    
    // Return empty array on 404 (no prescriptions)
    if (error.response?.status === 404) {
      return [];
    }
    
    throw {
      message: error.response?.data?.message || 'Không thể tải đơn thuốc. Vui lòng thử lại sau.',
      status: error.response?.status
    };
  }
};

/**
 * Receptionist Workflow APIs
 */

/**
 * Get medical records for a specific patient (receptionist only)
 * @param {number} patientId - Patient user ID
 * @returns {Promise<Array>} List of medical records for the patient
 */
export const getPatientRecordsByReceptionist = async (patientId) => {
  try {
    const response = await axios.get(
      `${MEDICAL_RECORDS_API}/patient/${patientId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching patient records:', error);
    throw error.response?.data || error;
  }
};

/**
 * Utility Functions
 */

/**
 * Format date to Vietnamese locale
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Get minimum date for reexamination (tomorrow)
 * @returns {string} Tomorrow's date in YYYY-MM-DD format
 */
export const getMinReexaminationDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export default {
  // Doctor APIs
  getCheckedInPatients,
  createMedicalRecord,
  createPrescriptions,
  updateReexaminationDate,
  completeAppointment,
  
  // Patient APIs
  getPatientMedicalHistory,
  getMedicalRecordDetails,
  getPrescriptions,
  
  // Receptionist APIs
  getPatientRecordsByReceptionist,
  
  // Utilities
  formatDate,
  formatDateForInput,
  getMinReexaminationDate
};
