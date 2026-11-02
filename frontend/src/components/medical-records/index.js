/**
 * Medical Records Components - Export Index
 * 
 * Simplifies imports in other files
 * Usage: import { MedicalHistory, MedicalRecordDetails } from '../medical-records';
 * 
 * Requirements: Medical Records System - Task 20.3
 */

// Doctor Workflow Components
export { default as CheckedInPatientsList } from './CheckedInPatientsList';
export { default as CreateMedicalRecordForm } from './CreateMedicalRecordForm';
export { default as PrescriptionsForm } from './PrescriptionsForm';
export { default as MedicalRecordActions } from './MedicalRecordActions';

// Patient Workflow Components
export { default as MedicalHistory } from './MedicalHistory';
export { default as MedicalRecordDetails } from './MedicalRecordDetails';
export { default as PrescriptionsList } from './PrescriptionsList';

// Shared Components
export { default as MedicalRecordCard } from './MedicalRecordCard';
