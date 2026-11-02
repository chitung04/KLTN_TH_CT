# Medical Records API Documentation

## Overview
API endpoints for managing medical records, prescriptions, and patient medical history in the THCT Clinic system.

**Base URL:** `http://localhost:5000/api`

**Authentication:** All endpoints require JWT token in Authorization header
```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents
- [Doctor Endpoints](#doctor-endpoints)
- [Patient Endpoints](#patient-endpoints)
- [Receptionist Endpoints](#receptionist-endpoints)
- [Shared Endpoints](#shared-endpoints)
- [Error Responses](#error-responses)

---

## Doctor Endpoints

### 1. Get Checked-In Patients

Returns list of patients who have checked-in today and are waiting for examination.

**Endpoint:** `GET /api/medical-records/checked-in`

**Authorization:** Doctor only

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "appointment_id": 1,
      "appointment_date": "2026-09-18",
      "time_slot": "08:00",
      "symptoms": "Sốt và ho",
      "status": "checked_in",
      "patient_id": 100,
      "patient_fullname": "Nguyễn Văn An",
      "patient_phone": "0901234567",
      "department_name": "Khoa Nội Tổng Quát"
    }
  ],
  "count": 1
}
```

---

### 2. Create Medical Record

Creates a new medical record for a checked-in appointment.

**Endpoint:** `POST /api/medical-records`

**Authorization:** Doctor only

**Request Body:**
```json
{
  "appointment_id": 1,
  "symptoms": "Sốt cao, ho khan",
  "diagnosis": "Cảm cúm thông thường",
  "note": "Nghỉ ngơi và uống nhiều nước",
  "reexamination_date": "2026-09-25"
}
```

**Fields:**
- `appointment_id` (required): ID of the appointment
- `symptoms` (optional): Will pre-fill from appointment if not provided
- `diagnosis` (optional): Doctor's diagnosis
- `note` (optional): Additional notes
- `reexamination_date` (optional): Future date or null

**Response:**
```json
{
  "success": true,
  "message": "Tạo hồ sơ khám bệnh thành công",
  "medicalRecord": {
    "id": 1,
    "appointment_id": 1,
    "symptoms": "Sốt cao, ho khan",
    "diagnosis": "Cảm cúm thông thường",
    "note": "Nghỉ ngơi và uống nhiều nước",
    "reexamination_date": "2026-09-25",
    "created_at": "2026-09-18T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- Appointment must be in "checked_in" status
- No existing medical record for this appointment
- Doctor must own the appointment
- reexamination_date must be future date or null

---

### 3. Create Prescriptions

Creates multiple prescriptions for a medical record.

**Endpoint:** `POST /api/medical-records/:id/prescriptions`

**Authorization:** Doctor only

**URL Parameters:**
- `id`: Medical record ID

**Request Body:**
```json
{
  "prescriptions": [
    {
      "medicine_name": "Paracetamol",
      "dosage": "500mg",
      "quantity": 20,
      "instructions": "Uống 1 viên mỗi 6 giờ khi sốt"
    },
    {
      "medicine_name": "Vitamin C",
      "dosage": "1000mg",
      "quantity": 10,
      "instructions": "Uống 1 viên mỗi ngày sau bữa ăn"
    }
  ]
}
```

**Fields:**
- `medicine_name` (required): Name of medicine
- `dosage` (required): Dosage information
- `quantity` (required): Quantity > 0
- `instructions` (optional): Usage instructions

**Response:**
```json
{
  "success": true,
  "message": "Kê đơn thuốc thành công",
  "prescriptionIds": [1, 2],
  "count": 2
}
```

**Validation Rules:**
- Medical record must exist and belong to doctor
- medicine_name cannot be empty
- quantity must be > 0
- Uses transaction for atomic insert

---

### 4. Update Reexamination Date

Updates the reexamination date for a medical record.

**Endpoint:** `PUT /api/medical-records/:id/reexamination`

**Authorization:** Doctor only

**URL Parameters:**
- `id`: Medical record ID

**Request Body:**
```json
{
  "reexamination_date": "2026-09-25"
}
```

To clear the date, set to `null`:
```json
{
  "reexamination_date": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật ngày tái khám thành công",
  "medicalRecord": {
    "id": 1,
    "appointment_id": 1,
    "symptoms": "...",
    "diagnosis": "...",
    "note": "...",
    "reexamination_date": "2026-09-25",
    "created_at": "2026-09-18T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- Medical record must exist and belong to doctor
- Date must be future or null

---

### 5. Complete Appointment

Changes appointment status from "checked_in" to "completed".

**Endpoint:** `PUT /api/appointments/:id/complete`

**Authorization:** Doctor only

**URL Parameters:**
- `id`: Appointment ID

**Response:**
```json
{
  "success": true,
  "message": "Hoàn thành lịch khám thành công",
  "appointment": {
    "id": 1,
    "status": "completed",
    "completed_at": "2026-09-18T11:00:00.000Z"
  }
}
```

**Validation Rules:**
- Appointment status must be "checked_in"
- Medical record must exist for appointment
- Doctor must own the appointment

---

## Patient Endpoints

### 6. Get Medical History

Returns all medical records for the authenticated patient.

**Endpoint:** `GET /api/medical-records/patient/history`

**Authorization:** Patient only

**Response:**
```json
{
  "success": true,
  "records": [
    {
      "medical_record_id": 1,
      "symptoms": "Sốt cao, ho khan",
      "diagnosis": "Cảm cúm thông thường",
      "note": "Nghỉ ngơi và uống nhiều nước",
      "reexamination_date": "2026-09-25",
      "created_at": "2026-09-18T10:30:00.000Z",
      "appointment_date": "2026-09-18",
      "time_slot": "08:00",
      "doctor_fullname": "BS. Nguyễn Văn Phong",
      "department_name": "Khoa Nội Tổng Quát"
    }
  ],
  "count": 1
}
```

**Notes:**
- Only returns completed appointments with medical records
- Ordered by appointment_date DESC (newest first)
- Patient can only view their own records

---

## Shared Endpoints

### 7. Get Medical Record Details

Returns detailed information about a specific medical record.

**Endpoint:** `GET /api/medical-records/:id`

**Authorization:** Patient (own records), Doctor (own records), Receptionist (any)

**URL Parameters:**
- `id`: Medical record ID

**Response:**
```json
{
  "success": true,
  "record": {
    "medical_record_id": 1,
    "symptoms": "Sốt cao, ho khan",
    "diagnosis": "Cảm cúm thông thường",
    "note": "Nghỉ ngơi và uống nhiều nước",
    "reexamination_date": "2026-09-25",
    "created_at": "2026-09-18T10:30:00.000Z",
    "appointment_id": 1,
    "appointment_date": "2026-09-18",
    "time_slot": "08:00",
    "patient_id": 100,
    "doctor_id": 10,
    "patient_fullname": "Nguyễn Văn An",
    "doctor_fullname": "BS. Nguyễn Văn Phong",
    "department_name": "Khoa Nội Tổng Quát"
  }
}
```

**Authorization Rules:**
- Patient: Can only view own records
- Doctor: Can only view own patient records
- Receptionist: Can view any record

---

### 8. Get Prescriptions

Returns all prescriptions for a specific medical record.

**Endpoint:** `GET /api/medical-records/:id/prescriptions`

**Authorization:** Patient (own records), Doctor (own records), Receptionist (any)

**URL Parameters:**
- `id`: Medical record ID

**Response:**
```json
{
  "success": true,
  "prescriptions": [
    {
      "prescription_id": 1,
      "medicine_name": "Paracetamol",
      "dosage": "500mg",
      "quantity": 20,
      "instructions": "Uống 1 viên mỗi 6 giờ khi sốt"
    },
    {
      "prescription_id": 2,
      "medicine_name": "Vitamin C",
      "dosage": "1000mg",
      "quantity": 10,
      "instructions": "Uống 1 viên mỗi ngày sau bữa ăn"
    }
  ],
  "count": 2
}
```

**Notes:**
- Returns empty array if no prescriptions
- Ordered by prescription_id ASC
- Same authorization rules as getMedicalRecordDetails

---

## Receptionist Endpoints

### 9. Get Patient Records by Receptionist

Returns all medical records for a specific patient.

**Endpoint:** `GET /api/medical-records/patient/:patientId`

**Authorization:** Receptionist only

**URL Parameters:**
- `patientId`: Patient user ID

**Response:**
```json
{
  "success": true,
  "patientId": 100,
  "records": [
    {
      "medical_record_id": 1,
      "symptoms": "Sốt cao, ho khan",
      "diagnosis": "Cảm cúm thông thường",
      "note": "Nghỉ ngơi và uống nhiều nước",
      "reexamination_date": "2026-09-25",
      "created_at": "2026-09-18T10:30:00.000Z",
      "appointment_date": "2026-09-18",
      "time_slot": "08:00",
      "doctor_fullname": "BS. Nguyễn Văn Phong",
      "department_name": "Khoa Nội Tổng Quát"
    }
  ],
  "count": 1
}
```

**Notes:**
- Receptionist can view any patient's records
- Ordered by appointment_date DESC

---

## Error Responses

### Common Error Codes

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELDS",
    "message": "appointment_id là bắt buộc"
  }
}
```

**Possible codes:**
- `MISSING_FIELDS`: Required field missing
- `INVALID_STATUS`: Appointment in wrong status
- `INVALID_DATE`: Past date provided for reexamination
- `INVALID_QUANTITY`: Prescription quantity <= 0
- `EMPTY_MEDICINE_NAME`: Medicine name empty
- `DUPLICATE_RECORD`: Medical record already exists
- `NO_MEDICAL_RECORD`: No medical record for appointment

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_MISSING",
    "message": "Token not provided"
  }
}
```

**Possible codes:**
- `TOKEN_MISSING`: No Authorization header
- `TOKEN_EXPIRED`: JWT has expired
- `TOKEN_INVALID`: Invalid JWT signature

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "NOT_AUTHORIZED",
    "message": "Bạn không có quyền tạo hồ sơ cho lịch hẹn này"
  }
}
```

**Possible codes:**
- `INSUFFICIENT_PERMISSIONS`: Wrong role for endpoint
- `NOT_AUTHORIZED`: User doesn't own the resource
- `NOT_A_DOCTOR`: User not registered as doctor

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "MEDICAL_RECORD_NOT_FOUND",
    "message": "Không tìm thấy hồ sơ khám bệnh"
  }
}
```

**Possible codes:**
- `APPOINTMENT_NOT_FOUND`: Appointment doesn't exist
- `MEDICAL_RECORD_NOT_FOUND`: Medical record doesn't exist
- `PATIENT_NOT_FOUND`: Patient doesn't exist

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Lỗi server khi tạo hồ sơ khám bệnh"
  }
}
```

---

## Workflow Examples

### Complete Doctor Workflow

1. **Login as doctor**
   ```
   POST /api/auth/login
   ```

2. **View checked-in patients**
   ```
   GET /api/medical-records/checked-in
   ```

3. **Create medical record**
   ```
   POST /api/medical-records
   Body: { appointment_id, symptoms, diagnosis, note, reexamination_date }
   ```

4. **Add prescriptions**
   ```
   POST /api/medical-records/:id/prescriptions
   Body: { prescriptions: [...] }
   ```

5. **Update reexamination date (optional)**
   ```
   PUT /api/medical-records/:id/reexamination
   Body: { reexamination_date }
   ```

6. **Complete appointment**
   ```
   PUT /api/appointments/:id/complete
   ```

### Complete Patient Workflow

1. **Login as patient**
   ```
   POST /api/auth/login
   ```

2. **View medical history**
   ```
   GET /api/medical-records/patient/history
   ```

3. **View record details**
   ```
   GET /api/medical-records/:id
   ```

4. **View prescriptions**
   ```
   GET /api/medical-records/:id/prescriptions
   ```

---

## Testing with cURL

### Get Checked-In Patients (Doctor)
```bash
curl -X GET http://localhost:5000/api/medical-records/checked-in \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

### Create Medical Record (Doctor)
```bash
curl -X POST http://localhost:5000/api/medical-records \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "symptoms": "Sốt cao, ho khan",
    "diagnosis": "Cảm cúm thông thường",
    "note": "Nghỉ ngơi và uống nhiều nước",
    "reexamination_date": "2026-09-25"
  }'
```

### Get Patient Medical History (Patient)
```bash
curl -X GET http://localhost:5000/api/medical-records/patient/history \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

---

## Database Schema Reference

### medical_records
- `id` INT PRIMARY KEY AUTO_INCREMENT
- `appointment_id` INT UNIQUE (FK to appointments)
- `symptoms` TEXT
- `diagnosis` TEXT
- `note` TEXT
- `reexamination_date` DATE NULL
- `created_at` TIMESTAMP

### prescriptions
- `id` INT PRIMARY KEY AUTO_INCREMENT
- `medical_record_id` INT (FK to medical_records)
- `medicine_name` VARCHAR(150) NOT NULL
- `dosage` VARCHAR(100) NOT NULL
- `quantity` INT NOT NULL
- `instructions` TEXT

---

**Version:** 1.0.0  
**Last Updated:** 2026-09-18  
**Contact:** THCT Clinic Development Team
