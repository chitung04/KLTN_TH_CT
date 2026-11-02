# 🚀 HƯỚNG DẪN CHẠY NHANH

## ⚡ Cách 1: Chạy tự động (Khuyên dùng)

**Windows:**
```bash
start.bat
```

Hoặc **double-click** vào file `start.bat`

---

## 🔧 Cách 2: Chạy thủ công

### Bước 1: Backend
Mở **Terminal 1**:
```bash
cd backend
npm start
```

✅ Chờ đến khi thấy:
```
🚀 THCT Clinic API Server running at http://localhost:5000
✅ MySQL Database connected successfully!
```

### Bước 2: Frontend  
Mở **Terminal 2**:
```bash
cd frontend
npm start
```

✅ Trình duyệt sẽ tự động mở: `http://localhost:3000`

---

## 🔑 TÀI KHOẢN ĐĂNG NHẬP

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

## 📊 KIỂM TRA HỆ THỐNG

### Test Backend API:
```bash
curl http://localhost:5000/api/appointments/doctors
```

### Test Frontend:
Mở trình duyệt: `http://localhost:3000`

---

## ❌ XỬ LÝ LỖI

### Lỗi: Port đã được sử dụng

**Backend (port 5000):**
```bash
# Tìm process
netstat -ano | findstr :5000

# Kill process (thay PID bằng số tìm được)
taskkill /PID <PID> /F
```

**Frontend (port 3000):**
```bash
# Tìm process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Lỗi: MySQL không kết nối

1. Mở **XAMPP Control Panel**
2. Click **Start** ở MySQL
3. Kiểm tra port: `3307`
4. Restart backend

### Lỗi: Rate limit exceeded

```bash
cd backend
node reset-all-rate-limits.js
```

---

## 🎯 TEST TÍNH NĂNG MỚI

### 1. Smart Recommendations
1. Đăng nhập với tài khoản bệnh nhân
2. Click **"Đặt lịch khám"**
3. Chọn chuyên khoa → Chọn bác sĩ
4. Chọn ngày
5. **Xem phần gợi ý AI** 🤖 ở trên cùng

### 2. Tìm kiếm bác sĩ
- Dùng ô tìm kiếm 🔍
- Lọc theo học vị (BS, ThS.BS...)
- Xem avatar bác sĩ đẹp hơn

### 3. Chọn giờ khám
- Xem chia theo buổi (Sáng/Chiều/Tối)
- Quick tags cho triệu chứng
- Summary card với icons

---

## 💡 MẸO

- Backend phải chạy **TRƯỚC** frontend
- Đợi backend kết nối database thành công
- Frontend tự động refresh khi save code
- Dùng `Ctrl + C` để dừng server

---

**🎉 Chúc bạn trải nghiệm tốt!**
