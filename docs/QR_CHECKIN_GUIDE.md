# Hướng Dẫn Sử Dụng Chức Năng QR Check-in

## 📱 Tổng Quan

Chức năng QR Check-in cho phép bệnh nhân tự động check-in khi đến phòng khám bằng cách quét mã QR từ lịch hẹn của họ. Điều này giúp:
- Giảm thời gian chờ đợi tại quầy lễ tân
- Tự động hóa quy trình tiếp nhận bệnh nhân
- Cập nhật trạng thái lịch hẹn real-time

## 🎯 Ai Có Thể Sử Dụng?

### 1. **Bệnh Nhân (Patient)**
- Tự check-in bằng mã QR từ lịch hẹn của mình
- Xác nhận đã đến phòng khám

### 2. **Lễ Tân (Receptionist)**
- Hỗ trợ bệnh nhân check-in
- Quét mã QR cho bệnh nhân không có điện thoại

### 3. **Quản Trị Viên (Admin)**
- Quản lý toàn bộ hệ thống check-in
- Xem thống kê check-in

### ❌ Không dành cho Bác Sĩ
Bác sĩ không cần check-in. Họ xem danh sách bệnh nhân đã check-in trong Dashboard.

## 📋 Quy Trình Check-in

### Bước 1: Đặt Lịch Khám
1. Bệnh nhân đặt lịch khám qua trang "Đặt lịch khám"
2. Hệ thống tự động tạo mã QR cho lịch hẹn
3. Mã QR được gửi qua email/SMS (future feature)

### Bước 2: Đến Phòng Khám
1. Bệnh nhân đến phòng khám vào ngày hẹn
2. Truy cập trang "Check-in QR" từ menu

### Bước 3: Check-in
#### **Cách 1: Quét QR Code** (Coming Soon)
- Nhấn "Bật Camera"
- Đưa mã QR vào khung quét
- Hệ thống tự động check-in

#### **Cách 2: Nhập Mã Thủ Công** (Hiện tại)
- Nhập mã lịch hẹn (VD: `THCT-1234567890`)
- Nhấn "Check-in"

### Bước 4: Xác Nhận
- Hệ thống hiển thị thông tin lịch hẹn
- Trạng thái chuyển sang "Đã check-in"
- Bệnh nhân chờ đến lượt khám

## 🔧 API Endpoint

### POST `/api/appointments/checkin`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "qrCode": "THCT-1726646400000"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Check-in thành công!",
  "appointment": {
    "id": 1,
    "qr_code_token": "THCT-1726646400000",
    "patient_id": 1,
    "patient_name": "Đỗ Chí Tùng",
    "doctor_id": 1,
    "doctor_name": "Bác sĩ Chuyên khoa I Nguyễn Văn Phong",
    "department_name": "Khoa Khám Bệnh - Nội Tổng Quát",
    "appointment_date": "2026-09-18",
    "time_slot": "08:00 - 08:30",
    "status": "checked_in"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Không tìm thấy lịch hẹn hợp lệ hoặc lịch hẹn đã được check-in/hủy"
}
```

```json
{
  "success": false,
  "message": "Chỉ có thể check-in vào ngày khám (2026-09-19). Hôm nay là 2026-09-18."
}
```

## ✅ Quy Tắc Check-in

1. **Chỉ check-in vào ngày khám**: Không thể check-in trước hoặc sau ngày hẹn
2. **Mỗi lịch hẹn chỉ check-in 1 lần**: Không thể check-in lại lịch hẹn đã check-in
3. **Trạng thái phải là "booked"**: Lịch hẹn đã hủy (cancelled) không thể check-in
4. **Xác thực token**: Phải đăng nhập để check-in

## 🔐 Phân Quyền

| Vai trò | Quyền truy cập |
|---------|----------------|
| Patient | ✅ Check-in cho chính mình |
| Receptionist | ✅ Check-in cho tất cả bệnh nhân |
| Admin | ✅ Check-in và quản lý hệ thống |
| Doctor | ❌ Không truy cập |

## 🎨 Giao Diện

### Trang Check-in
- **Header**: Tiêu đề và mô tả vai trò
- **Scanner Section**: Camera quét QR (future) hoặc nhập mã thủ công
- **Result Section**: Hiển thị thông tin sau khi check-in thành công
- **Stats Section**: Thống kê check-in trong ngày (future)

### Màu sắc trạng thái
- 🟢 **Đã check-in**: Xanh lá (#10b981)
- 🟡 **Đã đặt**: Vàng (#f59e0b)
- 🔴 **Đã hủy**: Đỏ (#ef4444)
- ⚪ **Hoàn thành**: Xám (#6b7280)

## 🧪 Test Chức Năng

### 1. Chuẩn bị dữ liệu test
```sql
-- Tạo lịch hẹn test
INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, qr_code_token, status) 
VALUES (1, 1, CURDATE(), '08:00 - 08:30', 'THCT-TEST123456', 'booked');
```

### 2. Test các trường hợp

#### Test 1: Check-in thành công
```bash
curl -X POST http://localhost:5000/api/appointments/checkin \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "THCT-TEST123456"}'
```

#### Test 2: Check-in sai ngày
```sql
-- Tạo lịch hẹn ngày mai
INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, qr_code_token, status) 
VALUES (1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '08:00 - 08:30', 'THCT-FUTURE123', 'booked');
```

```bash
curl -X POST http://localhost:5000/api/appointments/checkin \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "THCT-FUTURE123"}'
```

Kết quả: `Chỉ có thể check-in vào ngày khám...`

#### Test 3: Check-in lần 2
```bash
# Gọi lại API với cùng mã QR
curl -X POST http://localhost:5000/api/appointments/checkin \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "THCT-TEST123456"}'
```

Kết quả: `Không tìm thấy lịch hẹn hợp lệ...`

## 🚀 Tính Năng Tương Lai

### 1. Tích hợp QR Scanner thực tế
- Sử dụng thư viện `html5-qrcode`
- Quét QR từ camera thiết bị
- Hỗ trợ cả camera trước và sau

### 2. Gửi QR Code qua Email/SMS
- Tự động gửi QR khi đặt lịch thành công
- Template email đẹp mắt
- SMS với link QR

### 3. Thống kê Check-in
- Số lượng check-in trong ngày
- Số bệnh nhân đang chờ khám
- Thời gian chờ trung bình

### 4. Thông báo Real-time
- Thông báo cho bác sĩ khi có bệnh nhân check-in
- Cập nhật hàng đợi tự động
- WebSocket/SSE cho real-time updates

## 📝 Ghi Chú Kỹ Thuật

### Database Schema
```sql
CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL,
  qr_code_token VARCHAR(255) UNIQUE NOT NULL,
  status ENUM('booked', 'checked_in', 'completed', 'cancelled') DEFAULT 'booked',
  symptoms TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Mã QR Format
- Format: `THCT-{timestamp}`
- Ví dụ: `THCT-1726646400000`
- Unique cho mỗi lịch hẹn
- Dùng timestamp để đảm bảo tính duy nhất

## 🐛 Troubleshooting

### Lỗi: "Không thể truy cập camera"
- Kiểm tra quyền camera trong browser
- Đảm bảo đang dùng HTTPS (hoặc localhost)

### Lỗi: "Mã QR không hợp lệ"
- Kiểm tra format mã QR
- Đảm bảo mã QR chưa được sử dụng

### Lỗi: "Chỉ có thể check-in vào ngày khám"
- Kiểm tra ngày hẹn trong database
- Đảm bảo đang test với ngày hiện tại

## 📞 Liên Hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ:
- **Email**: support@thctclinic.vn
- **Hotline**: 1900-1234
