# 🚀 HƯỚNG DẪN CHẠY DỰ ÁN THCT CLINIC

## 📋 MỤC LỤC
1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt phần mềm](#cài-đặt-phần-mềm)
3. [Thiết lập Database](#thiết-lập-database)
4. [Cấu hình Backend](#cấu-hình-backend)
5. [Cấu hình Frontend](#cấu-hình-frontend)
6. [Chạy ứng dụng](#chạy-ứng-dụng)
7. [Tài khoản test](#tài-khoản-test)
8. [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)

---

## 1️⃣ YÊU CẦU HỆ THỐNG

### Phần cứng tối thiểu:
- **RAM:** 4GB (khuyến nghị 8GB)
- **Ổ cứng:** 2GB trống
- **CPU:** Dual-core trở lên

### Hệ điều hành:
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+)

---

## 2️⃣ CÀI ĐẶT PHẦN MỀM

### Bước 2.1: Cài đặt Node.js

1. **Tải Node.js:**
   - Truy cập: https://nodejs.org/
   - Tải phiên bản LTS (Long Term Support)
   - Khuyến nghị: Node.js 18.x hoặc 20.x

2. **Cài đặt:**
   - Windows: Chạy file `.msi` và làm theo hướng dẫn
   - macOS: Chạy file `.pkg` và làm theo hướng dẫn
   - Linux: 
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```

3. **Kiểm tra cài đặt:**
   ```bash
   node --version    # Nên hiện v18.x.x hoặc v20.x.x
   npm --version     # Nên hiện 9.x.x hoặc 10.x.x
   ```

### Bước 2.2: Cài đặt XAMPP (cho MySQL)

1. **Tải XAMPP:**
   - Truy cập: https://www.apachefriends.org/
   - Tải phiên bản phù hợp với hệ điều hành

2. **Cài đặt:**
   - Windows: Chạy file `.exe` và cài đặt vào `C:\xampp`
   - macOS/Linux: Làm theo hướng dẫn trên website

3. **Khởi động MySQL:**
   - Mở XAMPP Control Panel
   - Click "Start" ở dòng MySQL
   - MySQL sẽ chạy trên port 3306

---

## 3️⃣ THIẾT LẬP DATABASE

### Bước 3.1: Tạo Database

1. **Mở phpMyAdmin:**
   - Truy cập: http://localhost/phpmyadmin
   - Hoặc click "Admin" ở MySQL trong XAMPP Control Panel

2. **Import Database:**
   - Click tab "Import" ở menu trên
   - Click "Choose File" và chọn file: `database/kltn_clinic.sql`
   - Click "Go" ở cuối trang
   - Chờ import hoàn tất (khoảng 10-30 giây)

3. **Kiểm tra:**
   - Click vào database `kltn_clinic` bên trái
   - Bạn sẽ thấy 10+ bảng như: users, appointments, doctors, departments...

### Bước 3.2: Cập nhật thêm dữ liệu (Tùy chọn)

Nếu muốn thêm dữ liệu mẫu:
```bash
# Trong phpMyAdmin, chọn database kltn_clinic
# Import các file sau theo thứ tự:
1. database/add_more_doctors.sql       # Thêm bác sĩ
2. database/sample_data.sql           # Thêm dữ liệu mẫu
3. database/add_symptoms_column.sql   # Cập nhật cấu trúc
```

---

## 4️⃣ CẤU HÌNH BACKEND

### Bước 4.1: Cài đặt dependencies

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các package cần thiết
npm install
```

**Lưu ý:** Quá trình này có thể mất 2-5 phút tùy tốc độ Internet.

### Bước 4.2: Cấu hình file .env

File `backend/.env` đã có sẵn với cấu hình mặc định. Kiểm tra và chỉnh sửa nếu cần:

```env
# Cổng chạy server backend
PORT=5000

# Cấu hình MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=           # Để trống nếu không có password
DB_NAME=kltn_clinic
DB_PORT=3306

# JWT Secret (không nên thay đổi khi đã có dữ liệu)
JWT_SECRET=thct-clinic-super-secure-jwt-secret-key-2024-authentication-system-minimum-256-bits
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_ATTEMPTS=5
GLOBAL_RATE_LIMIT_MAX=1000

# Email (Tùy chọn - cho tính năng quên mật khẩu)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=THCT Clinic <noreply@thctclinic.vn>

# Environment
NODE_ENV=development
```

**Quan trọng:** Nếu MySQL của bạn có password, hãy điền vào `DB_PASSWORD=`

### Bước 4.3: Test kết nối Database

```bash
# Chạy script kiểm tra
node test-db.js
```

Kết quả mong đợi:
```
✅ Kết nối MySQL thành công!
Database: kltn_clinic
```

---

## 5️⃣ CẤU HÌNH FRONTEND

### Bước 5.1: Cài đặt dependencies

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các package
npm install
```

**Lưu ý:** Quá trình này có thể mất 3-7 phút.

### Bước 5.2: Cấu hình file .env

File `frontend/.env` đã có sẵn:

```env
# Cổng chạy website
HOST=0.0.0.0
PORT=3000

# URL của Backend API
REACT_APP_API_BASE=http://localhost:5000/api
```

**Lưu ý:** 
- Nếu bạn thay đổi `PORT` trong backend, nhớ cập nhật `REACT_APP_API_BASE`
- HOST=0.0.0.0 cho phép truy cập từ các thiết bị khác trong mạng LAN

---

## 6️⃣ CHẠY ỨNG DỤNG

### Cách 1: Chạy thủ công (Dành cho Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Kết quả:
```
🚀 Server đang chạy tại http://localhost:5000
✅ Kết nối MySQL thành công!
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Kết quả:
```
Compiled successfully!
Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

### Cách 2: Chạy với nodemon (Auto-restart khi code thay đổi)

**Backend với nodemon:**
```bash
cd backend
npm run dev
```

### Cách 3: Chạy cả 2 cùng lúc (Windows)

Tạo file `start.bat`:
```batch
@echo off
start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm start"
```

### Truy cập ứng dụng

- **Frontend (Website):** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Kiểm tra API health:** http://localhost:5000/api/health

---

## 7️⃣ TÀI KHOẢN TEST

Sau khi chạy xong, bạn có thể đăng nhập với các tài khoản sau:

### 👤 Bệnh nhân
```
Email: chitung@gmail.com
Password: Password123!
```

### 👨‍⚕️ Bác sĩ
```
Email: bsphong@clinic.com
Password: Password123!
```

### 👔 Lễ tân
```
Email: letan@gmail.com
Password: Password123!
```

### 👑 Admin
```
Email: admin@clinic.com
Password: Password123!
```

---

## 8️⃣ XỬ LÝ LỖI THƯỜNG GẶP

### ❌ Lỗi: "Cannot connect to MySQL"

**Nguyên nhân:** MySQL chưa chạy hoặc password không đúng

**Giải pháp:**
1. Kiểm tra XAMPP Control Panel → MySQL phải có màu xanh
2. Kiểm tra `DB_PASSWORD` trong `backend/.env`
3. Thử kết nối phpMyAdmin: http://localhost/phpmyadmin

### ❌ Lỗi: "Port 3000 already in use"

**Nguyên nhân:** Có ứng dụng khác đang dùng port 3000

**Giải pháp:**
```bash
# Cách 1: Đổi port trong frontend/.env
PORT=3001

# Cách 2: Kill process đang dùng port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Cách 2: Kill process (macOS/Linux)
lsof -ti:3000 | xargs kill -9
```

### ❌ Lỗi: "Module not found"

**Nguyên nhân:** Chưa cài đặt dependencies

**Giải pháp:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### ❌ Lỗi: "JWT token invalid"

**Nguyên nhân:** Token hết hạn hoặc JWT_SECRET bị thay đổi

**Giải pháp:**
1. Logout và login lại
2. Xóa localStorage trong browser (F12 → Application → Local Storage → Clear)
3. Kiểm tra `JWT_SECRET` trong `backend/.env` không bị thay đổi

### ❌ Lỗi: "CORS policy blocked"

**Nguyên nhân:** Frontend và Backend không cùng origin

**Giải pháp:**
1. Kiểm tra `REACT_APP_API_BASE` trong `frontend/.env`
2. Đảm bảo backend đang chạy trên port 5000
3. Restart cả frontend và backend

### ❌ Lỗi: "Database kltn_clinic not found"

**Nguyên nhân:** Chưa import database

**Giải pháp:**
1. Mở phpMyAdmin
2. Import lại file `database/kltn_clinic.sql`
3. Restart backend

---

## 🧪 CHẠY TESTS (Tùy chọn)

### Backend Tests:
```bash
cd backend

# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch

# Chạy test cho một file cụ thể
npx jest src/controllers/__tests__/authController.test.js
```

### Frontend Tests:
```bash
cd frontend

# Chạy tests
npm test
```

---

## 📱 TRUY CẬP TỪ ĐIỆN THOẠI (CÙNG MẠNG WIFI)

1. **Tìm IP máy tính:**
   ```bash
   # Windows
   ipconfig
   # Tìm dòng "IPv4 Address": 192.168.x.x

   # macOS/Linux
   ifconfig
   # Hoặc: ip addr
   ```

2. **Truy cập từ điện thoại:**
   - Mở browser trên điện thoại
   - Nhập: `http://192.168.x.x:3000`
   - Thay `192.168.x.x` bằng IP máy tính của bạn

---

## 🔧 CÔNG CỤ HỖ TRỢ

### Kiểm tra API với Postman/Thunder Client

**Health Check:**
```
GET http://localhost:5000/api/health
```

**Login:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "chitung@gmail.com",
  "password": "Password123!"
}
```

### Xem logs

**Backend logs:**
```bash
cd backend
# Logs sẽ hiện trên terminal khi chạy npm start
```

**Database logs:**
- Xem trong phpMyAdmin → SQL tab
- Hoặc check XAMPP logs: `xampp/mysql/data/mysql.err`

---

## 🎯 KIỂM TRA HỆ THỐNG HOẠT ĐỘNG

Checklist sau khi chạy xong:

- [ ] Backend chạy thành công trên port 5000
- [ ] Frontend chạy thành công trên port 3000
- [ ] MySQL đang chạy trong XAMPP
- [ ] Database `kltn_clinic` có dữ liệu
- [ ] Đăng nhập được với tài khoản test
- [ ] Có thể xem danh sách bác sĩ, khoa
- [ ] Có thể đặt lịch hẹn (nếu là bệnh nhân)

---

## 📞 HỖ TRỢ

Nếu gặp lỗi không nằm trong danh sách trên:

1. **Check logs** ở terminal backend và frontend
2. **Check browser console** (F12 → Console tab)
3. **Check database** có dữ liệu đầy đủ không

---

## 📚 TÀI LIỆU THAM KHẢO

- [README chính](README.md) - Tổng quan dự án
- [DEMO_GUIDE.md](DEMO_GUIDE.md) - Hướng dẫn demo cho giảng viên
- [QR_CHECKIN_GUIDE.md](docs/QR_CHECKIN_GUIDE.md) - Hướng dẫn tính năng QR check-in
- [Medical Records API](backend/docs/MEDICAL_RECORDS_API.md) - API hồ sơ y tế

---

**✅ Chúc bạn chạy thành công!**

*Last updated: 2026 | Version 1.0.0*
