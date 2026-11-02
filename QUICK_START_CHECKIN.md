# 🚀 Quick Start: Test Chức Năng QR Check-in

## Khởi động hệ thống

### 1. Khởi động Backend
```bash
cd backend
npm start
```
**Port**: `http://localhost:5000`

### 2. Khởi động Frontend
```bash
cd frontend
npm start
```
**Port**: `http://localhost:3000`

## Test Flow Đầy Đủ

### Bước 1: Đăng nhập
1. Mở `http://localhost:3000`
2. Nhấn "Đăng nhập"
3. Đăng nhập với tài khoản bệnh nhân:
   - **Email**: `chitung@gmail.com`
   - **Password**: `Password123!`

### Bước 2: Đặt lịch khám
1. Nhấn menu "Đặt lịch khám"
2. Chọn chuyên khoa và bác sĩ
3. Chọn ngày khám = **HÔM NAY** (quan trọng!)
4. Chọn khung giờ
5. Nhập triệu chứng
6. Nhấn "Xác nhận đặt lịch"
7. **Lưu lại mã QR** hiển thị (VD: `THCT-1726646400000`)

### Bước 3: Check-in
1. Nhấn menu "Check-in QR"
2. Nhập mã QR vừa lưu vào ô "Nhập mã thủ công"
3. Nhấn "Check-in"
4. ✅ Thấy thông báo "Check-in thành công!" và thông tin lịch hẹn

## Test Các Trường Hợp Lỗi

### ❌ Test 1: Check-in sai ngày
1. Đặt lịch cho **NGÀY MAI**
2. Thử check-in ngay hôm nay
3. Kết quả: "Chỉ có thể check-in vào ngày khám..."

### ❌ Test 2: Check-in 2 lần
1. Check-in thành công lần 1
2. Thử check-in lại với cùng mã QR
3. Kết quả: "Không tìm thấy lịch hẹn hợp lệ..."

### ❌ Test 3: Mã QR không tồn tại
1. Nhập mã QR ngẫu nhiên: `THCT-999999999`
2. Kết quả: "Không tìm thấy lịch hẹn hợp lệ..."

## Test với các Role khác nhau

### Lễ Tân (Receptionist)
```
Email: letan@gmail.com
Password: Password123!
```
- Có thể check-in cho tất cả bệnh nhân
- Giao diện hiển thị "Xác nhận bệnh nhân đến khám"

### Admin
```
Email: admin@clinic.com
Password: Password123!
```
- Có thể check-in và quản lý
- Giao diện hiển thị "Quản lý hệ thống check-in"

### Bác Sĩ (Không được truy cập)
```
Email: bsphong@clinic.com
Password: Password123!
```
- Không thể truy cập trang Check-in QR
- Thấy thông báo "Không có quyền truy cập"

## API Test với curl

### Check-in thành công
```bash
curl -X POST http://localhost:5000/api/appointments/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "qrCode": "THCT-1726646400000"
  }'
```

### Response mẫu
```json
{
  "success": true,
  "message": "Check-in thành công!",
  "appointment": {
    "id": 1,
    "qr_code_token": "THCT-1726646400000",
    "patient_name": "Đỗ Chí Tùng",
    "doctor_name": "Bác sĩ Chuyên khoa I Nguyễn Văn Phong",
    "department_name": "Khoa Khám Bệnh - Nội Tổng Quát",
    "appointment_date": "2026-09-18",
    "time_slot": "08:00 - 08:30",
    "status": "checked_in"
  }
}
```

## Tạo Dữ Liệu Test Nhanh (SQL)

```sql
-- Tạo lịch hẹn test cho hôm nay
INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, qr_code_token, status, symptoms) 
VALUES 
  (1, 1, CURDATE(), '08:00 - 08:30', 'THCT-TEST001', 'booked', 'Đau đầu, sốt'),
  (3, 2, CURDATE(), '09:00 - 09:30', 'THCT-TEST002', 'booked', 'Ho, khó thở'),
  (4, 1, CURDATE(), '10:00 - 10:30', 'THCT-TEST003', 'booked', 'Đau bụng');

-- Xem lịch hẹn vừa tạo
SELECT * FROM appointments WHERE qr_code_token LIKE 'THCT-TEST%';
```

Sau đó dùng các mã:
- `THCT-TEST001`
- `THCT-TEST002`
- `THCT-TEST003`

để test check-in!

## Xem Kết Quả Check-in

### Trong Database
```sql
-- Xem tất cả appointments đã check-in hôm nay
SELECT 
  a.id,
  a.qr_code_token,
  u.fullname as patient_name,
  ud.fullname as doctor_name,
  a.time_slot,
  a.status
FROM appointments a
JOIN users u ON a.patient_id = u.id
JOIN doctors d ON a.doctor_id = d.id
JOIN users ud ON d.user_id = ud.id
WHERE a.appointment_date = CURDATE()
  AND a.status = 'checked_in'
ORDER BY a.time_slot;
```

### Trong Dashboard (Coming Soon)
- Bác sĩ: Xem danh sách bệnh nhân đã check-in
- Lễ tân: Xem thống kê check-in
- Admin: Xem tất cả

## ✅ Checklist Test

- [ ] Đăng nhập thành công
- [ ] Đặt lịch khám cho hôm nay
- [ ] Nhận được mã QR
- [ ] Check-in thành công với mã QR
- [ ] Không thể check-in lần 2
- [ ] Không thể check-in sai ngày
- [ ] Bác sĩ không thể truy cập trang Check-in
- [ ] Lễ tân có thể check-in
- [ ] Admin có thể check-in

## 🐛 Lỗi Thường Gặp

### "Cannot read property 'qr_code_token' of undefined"
- Backend chưa chạy hoặc API không trả về đúng data
- Check console của browser và terminal backend

### "401 Unauthorized"
- Token hết hạn, đăng xuất và đăng nhập lại
- Hoặc chưa đăng nhập

### "CORS Error"
- Đảm bảo backend đang chạy port 5000
- Frontend đang chạy port 3000
- Check CORS config trong backend

### "Cannot POST /api/appointments/checkin"
- Backend routes chưa được thiết lập đúng
- Check file `backend/src/routes/appointmentRoutes.js`

## 📚 Tài Liệu Chi Tiết

Xem thêm: `docs/QR_CHECKIN_GUIDE.md`
