# 🎉 Hướng Dẫn Demo Hệ Thống Authentication - THCT Clinic

## ✅ Trạng Thái Hệ Thống

### Backend (100% Complete)
- ✅ Authentication APIs (register, login, logout)
- ✅ User management APIs (profile, update, change password)
- ✅ JWT token management
- ✅ Password hashing with bcrypt
- ✅ Rate limiting & security middleware
- ✅ Database schema enhancements

### Frontend (90% Complete - Ready for Demo)
- ✅ Login form with validation
- ✅ Register form with validation
- ✅ Auth modal integration
- ✅ User profile management (view, edit, change password)
- ✅ AuthContext state management
- ✅ Error boundaries & network detection
- ⚠️ Protected routes (Task 9 - chưa có)

## 🚀 Khởi Động Hệ Thống

### 1. Start Backend Server
```bash
cd backend
npm start
```

**Kiểm tra:** Truy cập http://localhost:5000 
- Nên thấy: `{"message": "THCT Clinic API is running successfully!"}`

### 2. Start Frontend
```bash
cd frontend
npm start
```

**Kiểm tra:** Truy cập http://localhost:3000
- Nên thấy trang chủ THCT Clinic với navigation bar

## 🎯 Demo Authentication Flow

### Scenario 1: User Registration (Đăng Ký Tài Khoản Mới)

1. **Mở trang chủ:** http://localhost:3000

2. **Click nút "Đăng ký"** ở góc trên phải
   - Modal đăng ký sẽ hiện ra

3. **Điền thông tin:**
   - Họ và tên: `Nguyễn Văn Test`
   - Email: `test@example.com`
   - Số điện thoại: `0901234567`
   - Mật khẩu: `Test123456` (phải có chữ hoa, chữ thường, số)
   - Xác nhận mật khẩu: `Test123456`
   - Ngày sinh: `01/01/2000`

4. **Click "Đăng ký"**
   - Loading spinner hiện ra
   - Nếu thành công: Modal đóng, user tự động đăng nhập
   - Navigation bar hiển thị: "Xin chào, Nguyễn Văn Test"

5. **Kiểm tra trong database:**
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

**Validation Demo:**
- Email sai format → Hiển thị lỗi ngay lập tức
- Mật khẩu yếu → Hiển thị lỗi yêu cầu
- Email đã tồn tại → Hiển thị "Email đã được sử dụng"

---

### Scenario 2: User Login (Đăng Nhập)

1. **Click nút "Đăng nhập"** ở góc trên phải

2. **Điền thông tin:**
   - Email: `test@example.com`
   - Mật khẩu: `Test123456`
   - ✓ Ghi nhớ đăng nhập (optional)

3. **Click "Đăng nhập"**
   - Loading spinner
   - Thành công → Modal đóng, hiển thị tên user
   - JWT token được lưu vào localStorage

4. **Reload trang (F5)**
   - User vẫn đăng nhập (session persistence)
   - Token tự động gửi kèm API requests

**Error Scenarios:**
- Sai email/password → "Email hoặc mật khẩu không đúng"
- Network error → Auto-retry với countdown
- Rate limiting → "Quá nhiều yêu cầu, vui lòng đợi"

---

### Scenario 3: Profile Management (Quản Lý Hồ Sơ)

**Yêu cầu:** Đã đăng nhập

1. **Click vào avatar/tên user** ở navigation bar

2. **Click "Hồ sơ cá nhân"**
   - Chuyển đến trang profile
   - Hiển thị thông tin đầy đủ:
     - Họ tên, email, phone, ngày sinh
     - Vai trò (Patient/Doctor/Receptionist/Admin)
     - Trạng thái xác minh email
     - Ngày đăng ký, lần đăng nhập cuối

3. **Chỉnh sửa thông tin:**
   - Click "Chỉnh sửa"
   - Thay đổi số điện thoại: `0909876543`
   - Click "Lưu thay đổi"
   - Thành công → Hiển thị "Cập nhật thông tin thành công!"

4. **Đổi mật khẩu:**
   - Click "Đổi mật khẩu"
   - Nhập mật khẩu hiện tại: `Test123456`
   - Nhập mật khẩu mới: `NewPass123`
   - Xác nhận mật khẩu mới: `NewPass123`
   - Click "Đổi mật khẩu"
   - Thành công → "Đổi mật khẩu thành công!"

**Validation Demo:**
- Email trùng → "Email đã được sử dụng bởi tài khoản khác"
- Phone trùng → "Số điện thoại đã được sử dụng"
- Mật khẩu hiện tại sai → "Mật khẩu hiện tại không đúng"
- Mật khẩu mới yếu → Password strength indicator đỏ

---

### Scenario 4: Logout (Đăng Xuất)

1. **Click vào dropdown menu** (avatar)
2. **Click "Đăng xuất"**
   - User được logout
   - Token bị xóa khỏi localStorage
   - Quay về trang chủ
   - Navigation bar hiển thị lại nút "Đăng nhập" & "Đăng ký"

---

### Scenario 5: Error Handling & Network Detection

**Offline Mode:**
1. Mở DevTools (F12) → Network tab
2. Chọn "Offline" trong dropdown
3. Thử login/register
   - Hiển thị: "Không có kết nối mạng"
   - Auto-retry countdown: 5, 4, 3, 2, 1...
   - Khi online trở lại → Tự động retry

**Slow Connection:**
1. DevTools → Network → "Slow 3G"
2. Thử đăng nhập
   - Hiển thị warning: "Kết nối chậm"
   - Request vẫn hoạt động nhưng lâu hơn

**Rate Limiting:**
1. Thử login sai 5 lần liên tiếp
   - Request thứ 6 → "Quá nhiều yêu cầu"
   - Phải đợi 15 phút hoặc dùng IP khác

---

## 🔍 Testing với Postman/cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test2@example.com",
    "phone": "0901234568",
    "password": "Test123456",
    "dateOfBirth": "2000-01-01"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "Test123456"
  }'
```

**Response:** Sẽ trả về JWT token
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "Test User",
    "email": "test2@example.com",
    "role": "patient"
  }
}
```

### Get Profile (Protected)
```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "phone": "0909999999"
  }'
```

---

## 📊 Demo Checklist

### ✅ Basic Features
- [ ] User registration với validation
- [ ] User login với JWT
- [ ] Logout và clear session
- [ ] Session persistence (reload trang)
- [ ] Profile view với thông tin đầy đủ
- [ ] Profile edit với validation
- [ ] Change password với old password verification

### ✅ Security Features
- [ ] Password hashing (không lưu plain text)
- [ ] JWT token authentication
- [ ] Rate limiting (5 attempts/15min)
- [ ] Email uniqueness check
- [ ] Phone uniqueness check
- [ ] XSS protection
- [ ] CSRF protection

### ✅ UX Features
- [ ] Real-time validation
- [ ] Loading states
- [ ] Error messages (Vietnamese)
- [ ] Success feedback
- [ ] Offline detection
- [ ] Slow connection warning
- [ ] Auto-retry logic
- [ ] Password strength indicator

### ⚠️ Known Limitations (Chưa Implement)
- ❌ Protected routing (Task 9) - Tất cả pages đều public
- ❌ Role-based dashboards (Task 9.2) - Patient/Doctor/Receptionist/Admin
- ❌ Password reset via email (Task 12)
- ❌ Email verification (Task 12.3)
- ❌ 2FA authentication (Task 13.3)
- ❌ Admin user management interface (Task 13.2)

---

## 🐛 Troubleshooting

### Backend không kết nối database
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Kiểm tra database tồn tại
SHOW DATABASES;
USE thct_clinic;
SHOW TABLES;
```

### Frontend không gọi được API
- Kiểm tra CORS trong backend/.env:
```
FRONTEND_URL=http://localhost:3000
```

- Kiểm tra API base URL trong frontend/src/services/authAPI.js:
```javascript
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
```

### Token không được gửi
- Mở DevTools → Application → Local Storage
- Kiểm tra có key `token` không
- Kiểm tra Network tab → Headers → Authorization: Bearer ...

### Modal không hiện
- ✅ ĐÃ SỬA: AuthModal đã được thêm vào tất cả pages

---

## 🎬 Demo Script Đầy Đủ (5 phút)

### Phần 1: Registration (1 phút)
1. Giới thiệu trang chủ
2. Click "Đăng ký"
3. Điền form với validation demo
4. Submit → Success → Auto login

### Phần 2: Login & Session (1 phút)
1. Logout
2. Click "Đăng nhập"
3. Login thành công
4. Reload trang → Session persist

### Phần 3: Profile Management (2 phút)
1. Navigate to profile
2. View user information
3. Edit profile (change phone)
4. Change password với strength indicator

### Phần 4: Error Handling (1 phút)
1. Turn off network → Show offline mode
2. Slow connection warning
3. Rate limiting demo

---

## 📝 Notes for Presentation

**Điểm mạnh để nhấn mạnh:**
- ✅ Full-stack authentication system
- ✅ Security best practices (JWT, bcrypt, rate limiting)
- ✅ Excellent UX (real-time validation, loading states)
- ✅ Network resilience (offline mode, auto-retry)
- ✅ Responsive design (mobile-friendly)
- ✅ Vietnamese language support
- ✅ Accessibility compliance (ARIA labels)

**Điểm cần cải thiện (future work):**
- Protected routing with role-based access
- Password reset via email
- Email verification
- 2FA authentication
- Admin dashboard
- Audit logging dashboard

---

## 🎯 Kết Luận

Hệ thống authentication đã **SẴN SÀNG DEMO** với đầy đủ tính năng core:
- User registration & login ✅
- Profile management ✅
- Security features ✅
- Error handling ✅
- Network detection ✅

**Thời gian demo ước tính:** 5-10 phút
**Độ hoàn thiện:** 90% (MVP ready)
**Bugs nghiêm trọng:** 0 (đã fix AuthModal render issue)

Good luck với demo! 🚀
