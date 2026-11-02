# 🚀 HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG KLTN CLINIC

## ✅ YÊU CẦU

- **XAMPP** (Apache + MySQL)
- **Node.js** (v16 trở lên)
- **Trình duyệt** (Chrome, Firefox...)

---

## 📥 BƯỚC 1: CÀI ĐẶT DATABASE

### 1.1. Khởi động MySQL
1. Mở **XAMPP Control Panel**
2. Click **Start** ở MySQL (đảm bảo chạy port **3307**)
3. Click **Start** ở Apache

### 1.2. Tạo và Import Database

**Cách 1: Qua phpMyAdmin (Khuyên dùng)**
1. Mở trình duyệt: `http://localhost/phpmyadmin`
2. Click **"New"** ở sidebar trái
3. Nhập tên database: `kltn_clinic`
4. Chọn Collation: `utf8_unicode_ci`
5. Click **"Create"**
6. Click vào database `kltn_clinic` vừa tạo
7. Click tab **"Import"**
8. Click **"Choose File"** và chọn: `database/kltn_clinic.sql`
9. Scroll xuống và click **"Go"**
10. Đợi import xong (thấy thông báo màu xanh)

**Cách 2: Qua Command Line**
```bash
# Mở Command Prompt tại thư mục dự án
cd C:\xampp\mysql\bin
mysql -u root --port=3307 -e "CREATE DATABASE IF NOT EXISTS kltn_clinic CHARACTER SET utf8 COLLATE utf8_unicode_ci"
mysql -u root --port=3307 kltn_clinic < "C:\xampp\htdocs\KLTN\database\kltn_clinic.sql"
```

---

## 🔧 BƯỚC 2: CÀI ĐẶT BACKEND

```bash
# Mở terminal tại thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Khởi động server
npm start
```

**Server chạy thành công khi thấy:**
```
🚀 THCT Clinic API Server running at http://localhost:5000
✅ MySQL Database connected successfully!
```

---

## 🎨 BƯỚC 3: CÀI ĐẶT FRONTEND

```bash
# Mở terminal mới tại thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Khởi động frontend
npm start
```

**Frontend sẽ tự động mở tại:** `http://localhost:3000`

---

## 🔑 BƯỚC 4: ĐĂNG NHẬP THỬ

### Tài khoản có sẵn:

**Bệnh nhân:**
- Email: `chitung@gmail.com`
- Password: `Password123!`

**Bác sĩ:**
- Email: `bsphong@clinic.com`
- Password: `Password123!`

**Lễ tân:**
- Email: `letan@gmail.com`
- Password: `Password123!`

**Admin:**
- Email: `admin@clinic.com`
- Password: `Password123!`

---

## 📊 DỮ LIỆU CÓ SẴN

File `database/kltn_clinic.sql` bao gồm:

✅ **12 Users:**
- 3 bệnh nhân (patients)
- 6 bác sĩ (doctors)
- 2 lễ tân (receptionists)
- 1 admin

✅ **8 Departments (Chuyên khoa):**
- Nội tổng quát
- Tim mạch
- Ngoại tổng quát
- Sản - Phụ khoa
- Nhi
- Da liễu
- Mắt
- Tai - Mũi - Họng

✅ **6 Doctors với thông tin chuyên khoa**

✅ **Tất cả bảng:** users, doctors, departments, appointments, medical_records, prescriptions, auth_audit_logs, user_sessions

---

## ❌ XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi 1: Backend không kết nối database
```
❌ MySQL Database Connection Error
```
**Giải pháp:**
1. Kiểm tra MySQL đã chạy trong XAMPP chưa
2. Kiểm tra port trong file `backend/.env` (phải là 3307)
3. Kiểm tra database `kltn_clinic` đã được tạo chưa

### Lỗi 2: Rate limit exceeded
```
Rate limit exceeded
```
**Giải pháp:**
```bash
cd backend
node reset-all-rate-limits.js
```

### Lỗi 3: Database chưa tồn tại
```
Unknown database 'kltn_clinic'
```
**Giải pháp:**
- Import lại file `database/kltn_clinic.sql` theo hướng dẫn ở Bước 1

### Lỗi 4: Port 3000 hoặc 5000 đã bị sử dụng
**Giải pháp:**
```bash
# Windows: Tìm và kill process đang dùng port
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

---

## 📝 GHI CHÚ

- **Backend port:** 5000
- **Frontend port:** 3000
- **MySQL port:** 3307
- **Password mặc định:** Password123! (cho tất cả tài khoản)

---

## 🎉 HOÀN TẤT!

Sau khi hoàn tất các bước trên:
1. Backend chạy ở: http://localhost:5000
2. Frontend chạy ở: http://localhost:3000
3. Đăng nhập với một trong các tài khoản ở trên
4. Bắt đầu sử dụng hệ thống!

---

**Made with ❤️ by THCT Clinic Team | Version 1.0.0 | 2026**
