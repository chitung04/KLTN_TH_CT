# ❌ KHẮC PHỤC LỖI IMPORT

## Lỗi bạn gặp:
```
#1046 - No database selected
```

## ✅ CÁCH SỬA:

### **Bước 1: XÓA database cũ (nếu có)**
1. Trong phpMyAdmin, click vào database `kltn_clinic` ở sidebar trái
2. Click tab **"Operations"**
3. Scroll xuống phần **"Remove database"**
4. Click **"Drop the database (DROP)"**
5. Confirm xóa

### **Bước 2: TẠO LẠI database MỚI**
1. Click **"New"** ở sidebar trái (hoặc tab "Databases" ở trên)
2. Trong ô **"Database name"**: gõ `kltn_clinic`
3. Trong dropdown **"Collation"**: chọn `utf8_unicode_ci`
4. Click nút **"Create"**

### **Bước 3: CHỌN database trước khi import**
1. ⚠️ **QUAN TRỌNG:** Click vào database **`kltn_clinic`** ở sidebar BÊN TRÁI
2. Đảm bảo bạn thấy tên `kltn_clinic` được highlight (màu sáng hơn)
3. Database sẽ hiển thị "(0)" - chưa có bảng nào

### **Bước 4: IMPORT file SQL**
1. Click tab **"Import"** ở trên
2. Click **"Choose File"**
3. Chọn file: `C:\xampp\htdocs\KLTN\database\kltn_clinic.sql`
4. Scroll xuống cuối trang
5. Click nút **"Go"** (màu xanh)
6. Đợi 5-10 giây

### **Bước 5: KIỂM TRA**
1. Click lại vào `kltn_clinic` ở sidebar trái
2. Bạn sẽ thấy các bảng: `appointments`, `auth_audit_logs`, `departments`, `doctors`, `medical_records`, `prescriptions`, `users`, `user_sessions`
3. Click vào bảng `users` → tab **"Browse"** → sẽ thấy 12 users

---

## 🎯 LƯU Ý QUAN TRỌNG:

**Lỗi "No database selected" xảy ra khi:**
- ❌ Import file SQL mà chưa chọn database trước
- ❌ Đang ở trang chủ phpMyAdmin khi import

**Đúng cách:**
- ✅ Phải CHỌN database `kltn_clinic` ở sidebar TRƯỚC
- ✅ Đảm bảo tên database được highlight
- ✅ Sau đó mới click tab Import

---

## 🚀 SAU KHI IMPORT THÀNH CÔNG:

Chạy lệnh này để test:

\`\`\`bash
cd backend
node test-login.js
\`\`\`

Sẽ hiển thị danh sách 12 tài khoản với password `Password123!`

Sau đó có thể đăng nhập vào hệ thống! 🎉
