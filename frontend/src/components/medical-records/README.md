# Medical Records Components

This directory contains React components for the Medical Records Management System, supporting both doctor and patient workflows.

## Components

### Patient Workflow Components

#### MedicalHistory
Displays a list of the patient's medical records with appointment details.

**Props:**
- `onViewDetails(record)` - Callback when user clicks to view a record's details

**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5

**Features:**
- Lists all medical records ordered by appointment date (newest first)
- Shows appointment date, doctor name, department, symptoms, diagnosis
- Click on record to view full details
- Handles loading, error, and empty states
- Refresh button to reload data

#### MedicalRecordDetails
Displays full details of a single medical record.

**Props:**
- `medicalRecordId` - ID of the medical record to display
- `onBack()` - Callback for back button

**Requirements:** 7.1, 7.2, 7.3, 7.4

**Features:**
- Displays appointment information (date, time, doctor, department)
- Shows medical information (symptoms, diagnosis, note, reexamination date)
- Includes prescriptions list via PrescriptionsList component
- Back button to return to list
- Handles loading, error, and not found states

#### PrescriptionsList
Displays prescriptions for a medical record in table format.

**Props:**
- `medicalRecordId` - ID of the medical record to fetch prescriptions for

**Requirements:** 8.1, 8.2, 8.3, 8.4

**Features:**
- Table display with columns: STT, Medicine Name, Dosage, Quantity, Instructions
- Empty state when no prescriptions exist
- Handles loading and error states
- Automatically numbered rows

### Doctor Workflow Components

#### CheckedInPatientsList
Displays list of checked-in patients waiting to be seen by the doctor.

**Props:**
- `onSelectPatient(patient)` - Callback when doctor selects a patient

**Requirements:** 1.1, 1.2, 1.3, 1.4

#### CreateMedicalRecordForm
Form for doctor to create a medical record for a patient.

**Props:**
- `patient` - Patient/appointment object
- `onSuccess(medicalRecord)` - Callback on successful creation
- `onCancel()` - Callback for cancel button

**Requirements:** 2.1, 2.2, 2.3, 2.4

#### PrescriptionsForm
Form for doctor to add prescriptions to a medical record.

**Props:**
- `medicalRecordId` - ID of the medical record
- `onSuccess(prescriptions)` - Callback on successful creation
- `onCancel()` - Callback for cancel button

**Requirements:** 3.1, 3.2, 3.3, 3.4, 3.5

#### MedicalRecordActions
Action buttons for doctor to update reexamination date and complete appointments.

**Props:**
- `medicalRecordId` - ID of the medical record
- `appointmentId` - ID of the appointment
- `onComplete()` - Callback when appointment is completed

**Requirements:** 4.1, 4.2, 5.1, 5.2

## Usage Example

### Patient Viewing Medical History

```javascript
import React, { useState } from 'react';
import { MedicalHistory, MedicalRecordDetails } from './components/medical-records';

function PatientMedicalRecordsPage() {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleViewDetails = (record) => {
    setSelectedRecord(record.medical_record_id);
  };

  const handleBack = () => {
    setSelectedRecord(null);
  };

  if (selectedRecord) {
    return (
      <MedicalRecordDetails
        medicalRecordId={selectedRecord}
        onBack={handleBack}
      />
    );
  }

  return (
    <MedicalHistory onViewDetails={handleViewDetails} />
  );
}
```

### Doctor Creating Medical Record

```javascript
import React, { useState } from 'react';
import { CheckedInPatientsList, CreateMedicalRecordForm } from './components/medical-records';

function DoctorMedicalRecordsPage() {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };

  const handleSuccess = (medicalRecord) => {
    console.log('Medical record created:', medicalRecord);
    // Navigate to prescriptions form or show success message
    setSelectedPatient(null);
  };

  const handleCancel = () => {
    setSelectedPatient(null);
  };

  if (selectedPatient) {
    return (
      <CreateMedicalRecordForm
        patient={selectedPatient}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <CheckedInPatientsList onSelectPatient={handleSelectPatient} />
  );
}
```

## Styling

All components use the shared `MedicalRecords.css` stylesheet, which follows the THCT Clinic design system with consistent colors, spacing, and responsive design.

## API Integration

Components use the `medicalRecordsService.js` API service for all backend communication:
- `getPatientMedicalHistory()` - Fetch patient's medical history
- `getMedicalRecordDetails(id)` - Fetch single record details
- `getPrescriptions(id)` - Fetch prescriptions for a record
- `getCheckedInPatients()` - Fetch checked-in patients (doctor)
- `createMedicalRecord(data)` - Create new medical record (doctor)
- `createPrescriptions(id, prescriptions)` - Add prescriptions (doctor)

All API calls include JWT authentication automatically via the service.

## Error Handling

All components implement comprehensive error handling:
- Loading states with spinner
- Error states with retry button
- Empty states with helpful messages
- Form validation with error messages

## Accessibility

- Semantic HTML elements
- ARIA labels on buttons
- Keyboard navigation support
- Screen reader friendly content
- Color contrast compliance

## Testing

Unit tests for each component are located in:
- `__tests__/MedicalHistory.test.js`
- `__tests__/MedicalRecordDetails.test.js`
- `__tests__/PrescriptionsList.test.js`

Run tests with: `npm test`

## Notes

- All dates are formatted using the `formatDate()` utility from medicalRecordsService
- Components follow React functional component patterns with hooks
- State management uses useState and useEffect
- Authorization is handled at the API level
