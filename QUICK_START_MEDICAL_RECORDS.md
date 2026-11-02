# 🚀 Quick Start Guide - Medical Records System

## Bắt đầu nhanh trong 5 phút!

---

## Bước 1: Chuẩn bị Database

### 1.1. Chạy migration để thêm indexes

Mở MySQL command line hoặc phpMyAdmin và chạy:

```sql
USE kltn_clinic;

-- Add index for performance optimization
ALTER TABLE appointments
  ADD INDEX idx_appointments_doctor_date_status (doctor_id, appointment_date, status);
```

Hoặc import file:
```bash
mysql -u root -p kltn_clinic < database/add_indexes_medical_records.sql
```

### 1.2. Kiểm tra tables đã có chưa

```sql
-- Check medical_records table
SELECT * FROM medical_records LIMIT 1;

-- Check prescriptions table
SELECT * FROM prescriptions LIMIT 1;

-- Check indexes
SHOW INDEX FROM appointments WHERE Key_name = 'idx_appointments_doctor_date_status';
```

---

## Bước 2: Khởi động Backend Server

```bash
cd backend
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

Kiểm tra server đang chạy:
```bash
curl http://localhost:5000
```

Expected response:
```json
{
  "message": "THCT Clinic API is running successfully!",
  "timestamp": "...",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## Bước 3: Lấy JWT Tokens

### 3.1. Login as Doctor (Bác sĩ)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bsphong@clinic.com",
    "password": "Password123!"
  }'
```

Lưu `token` trong response vào biến:
```bash
DOCTOR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3.2. Login as Patient (Bệnh nhân)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chitung@gmail.com",
    "password": "Password123!"
  }'
```

Lưu `token`:
```bash
PATIENT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3.3. Login as Receptionist (Lễ tân)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "letan@gmail.com",
    "password": "Password123!"
  }'
```

Lưu `token`:
```bash
RECEPTIONIST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Bước 4: Test Workflow - Doctor (Bác sĩ)

### 4.1. Tạo Appointment và Check-in (Setup)

Trước tiên cần có appointment với status "checked_in":

```bash
# 1. Tạo appointment (as patient)
curl -X POST http://localhost:5000/api/appointments/create \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "appointment_date": "2026-09-18",
    "time_slot": "08:00",
    "symptoms": "Sốt cao và ho khan"
  }'

# Lưu appointment_id từ response

# 2. Check-in appointment (as receptionist)
curl -X POST http://localhost:5000/api/appointments/checkin \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qr_code_token": "THCT-xxxxx"
  }'
```

### 4.2. Xem danh sách bệnh nhân đã check-in

```bash
curl -X GET http://localhost:5000/api/medical-records/checked-in \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "appointments": [
    {
      "appointment_id": 1,
      "appointment_date": "2026-09-18",
      "time_slot": "08:00",
      "symptoms": "Sốt cao và ho khan",
      "patient_fullname": "Đỗ Chí Tùng",
      "patient_phone": "0901234567"
    }
  ],
  "count": 1
}
```

### 4.3. Tạo hồ sơ khám bệnh

```bash
curl -X POST http://localhost:5000/api/medical-records \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "symptoms": "Sốt cao 39°C, ho khan, đau họng",
    "diagnosis": "Viêm họng cấp do virus",
    "note": "Nghỉ ngơi 3 ngày, uống nhiều nước, theo dõi thân nhiệt",
    "reexamination_date": "2026-09-25"
  }'
```

Lưu `medicalRecord.id` từ response (ví dụ: `medical_record_id = 1`)

### 4.4. Kê đơn thuốc

```bash
curl -X POST http://localhost:5000/api/medical-records/1/prescriptions \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptions": [
      {
        "medicine_name": "Paracetamol",
        "dosage": "500mg",
        "quantity": 20,
        "instructions": "Uống 1 viên mỗi 6 giờ khi sốt trên 38°C"
      },
      {
        "medicine_name": "Vitamin C",
        "dosage": "1000mg",
        "quantity": 10,
        "instructions": "Uống 1 viên mỗi ngày sau bữa ăn sáng"
      },
      {
        "medicine_name": "Thuốc nhỏ họng Strepsils",
        "dosage": "1 viên",
        "quantity": 24,
        "instructions": "Ngậm 1 viên mỗi 2-3 giờ, không quá 8 viên/ngày"
      }
    ]
  }'
```

### 4.5. Cập nhật ngày tái khám (Optional)

```bash
curl -X PUT http://localhost:5000/api/medical-records/1/reexamination \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reexamination_date": "2026-09-26"
  }'
```

### 4.6. Hoàn thành lịch khám

```bash
curl -X PUT http://localhost:5000/api/appointments/1/complete \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

---

## Bước 5: Test Workflow - Patient (Bệnh nhân)

### 5.1. Xem lịch sử khám bệnh

```bash
curl -X GET http://localhost:5000/api/medical-records/patient/history \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### 5.2. Xem chi tiết hồ sơ

```bash
curl -X GET http://localhost:5000/api/medical-records/1 \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### 5.3. Xem đơn thuốc

```bash
curl -X GET http://localhost:5000/api/medical-records/1/prescriptions \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

---

## Bước 6: Test Workflow - Receptionist (Lễ tân)

### 6.1. Xem hồ sơ của bệnh nhân cụ thể

```bash
curl -X GET http://localhost:5000/api/medical-records/patient/1 \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN"
```

Replace `1` với patient_id của bệnh nhân cần xem.

---

## 🧪 Test Cases - Validation & Security

### Test 1: Không thể tạo hồ sơ cho appointment chưa check-in

```bash
# Tạo appointment mới (status = 'booked')
curl -X POST http://localhost:5000/api/appointments/create \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "appointment_date": "2026-09-19",
    "time_slot": "09:00",
    "symptoms": "Test"
  }'

# Thử tạo hồ sơ (sẽ bị reject)
curl -X POST http://localhost:5000/api/medical-records \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 2,
    "diagnosis": "Test"
  }'
```

Expected error:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Lịch hẹn phải ở trạng thái \"checked_in\" để tạo hồ sơ"
  }
}
```

### Test 2: Không thể tạo duplicate medical record

```bash
# Thử tạo hồ sơ lần 2 cho cùng appointment
curl -X POST http://localhost:5000/api/medical-records \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "diagnosis": "Test duplicate"
  }'
```

Expected error:
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RECORD",
    "message": "Hồ sơ khám bệnh đã tồn tại cho lịch hẹn này"
  }
}
```

### Test 3: Patient không thể xem hồ sơ của người khác

```bash
# Tạo medical record cho patient khác (id=3)
# Sau đó patient 1 thử xem

curl -X GET http://localhost:5000/api/medical-records/2 \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

Expected error:
```json
{
  "success": false,
  "error": {
    "code": "NOT_AUTHORIZED",
    "message": "Bạn không có quyền xem hồ sơ này"
  }
}
```

### Test 4: Validation - Quantity phải > 0

```bash
curl -X POST http://localhost:5000/api/medical-records/1/prescriptions \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptions": [
      {
        "medicine_name": "Test",
        "dosage": "500mg",
        "quantity": 0,
        "instructions": "Test"
      }
    ]
  }'
```

Expected error:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Số lượng thuốc phải lớn hơn 0..."
  }
}
```

---

## 📊 Verification Queries

Kiểm tra data trong database:

```sql
-- Xem tất cả medical records
SELECT 
    mr.id,
    a.appointment_date,
    p.fullname as patient_name,
    d.fullname as doctor_name,
    mr.diagnosis,
    mr.reexamination_date
FROM medical_records mr
JOIN appointments a ON mr.appointment_id = a.id
JOIN users p ON a.patient_id = p.id
JOIN doctors doc ON a.doctor_id = doc.id
JOIN users d ON doc.user_id = d.id
ORDER BY mr.created_at DESC;

-- Xem prescriptions
SELECT 
    p.id,
    p.medicine_name,
    p.dosage,
    p.quantity,
    p.instructions,
    mr.id as medical_record_id
FROM prescriptions p
JOIN medical_records mr ON p.medical_record_id = mr.id
ORDER BY p.id DESC;

-- Kiểm tra appointment status
SELECT 
    id,
    patient_id,
    doctor_id,
    appointment_date,
    time_slot,
    status
FROM appointments
WHERE appointment_date = CURDATE()
ORDER BY time_slot;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Token not provided"
**Solution:** Kiểm tra đã thêm header `Authorization: Bearer <token>`

### Issue 2: "NOT_A_DOCTOR"
**Solution:** Đảm bảo user_id trong token có record trong bảng `doctors`

### Issue 3: "APPOINTMENT_NOT_FOUND"
**Solution:** Kiểm tra appointment_id có tồn tại không

### Issue 4: Database connection error
**Solution:** 
```bash
# Kiểm tra MySQL đang chạy
sudo service mysql status

# Kiểm tra .env file
cat backend/.env
```

---

## 📱 Test với Postman (Alternative)

### Import Collection

Tạo Postman collection với các endpoints sau:

**Environment Variables:**
- `base_url`: `http://localhost:5000`
- `doctor_token`: (lấy từ login)
- `patient_token`: (lấy từ login)
- `receptionist_token`: (lấy từ login)

**Requests:**
1. POST `/api/auth/login` - Login
2. GET `/api/medical-records/checked-in`
3. POST `/api/medical-records`
4. POST `/api/medical-records/:id/prescriptions`
5. PUT `/api/medical-records/:id/reexamination`
6. PUT `/api/appointments/:id/complete`
7. GET `/api/medical-records/patient/history`
8. GET `/api/medical-records/:id`
9. GET `/api/medical-records/:id/prescriptions`
10. GET `/api/medical-records/patient/:patientId`

---

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Server running on port 5000
- [ ] Doctor login successful
- [ ] Patient login successful
- [ ] Receptionist login successful
- [ ] Doctor can view checked-in patients
- [ ] Doctor can create medical record
- [ ] Doctor can add prescriptions
- [ ] Doctor can complete appointment
- [ ] Patient can view medical history
- [ ] Patient can view prescriptions
- [ ] Receptionist can view patient records
- [ ] Validation working (duplicate, status, etc.)
- [ ] Authorization working (role-based)

---

## 🎓 Next Steps

1. ✅ Complete all tests above
2. 📝 Note any issues found
3. 🔄 Try error scenarios
4. 📊 Check database data
5. 🚀 Ready for frontend integration!

---

## 📞 Need Help?

Tham khảo:
- 📖 [Full API Documentation](backend/docs/MEDICAL_RECORDS_API.md)
- 📘 [README](backend/README_MEDICAL_RECORDS.md)
- 📊 [Implementation Summary](MEDICAL_RECORDS_IMPLEMENTATION_SUMMARY.md)

---

**Happy Testing! 🎉**
