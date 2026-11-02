# 🏥 HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THCT CLINIC

> Website đặt lịch khám online + QR check-in + Hồ sơ y tế điện tử

**Khóa luận tốt nghiệp 2026**  
**SV:** Nguyễn Thu Hằng, Đỗ Chí Tùng | **GVHD:** TS. Ngô Hữu Dũng

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![Completion](https://img.shields.io/badge/completion-77%25-yellow.svg)]()

---

## 📌 HỆ THỐNG LÀM GÌ?

Website quản lý phòng khám giúp:
- 👤 **Bệnh nhân:** Đặt lịch online, nhận QR code, xem hồ sơ bệnh án
- 👔 **Lễ tân:** Quét QR để check-in bệnh nhân
- 👨‍⚕️ **Bác sĩ:** Khám bệnh, kê đơn thuốc, lưu hồ sơ điện tử
- 👑 **Admin:** Quản lý toàn bộ hệ thống

**Giải quyết vấn đề:** Không còn xếp hàng, hồ sơ giấy thất lạc, đặt lịch phức tạp!

---

## 💻 CÔNG NGHỆ SỬ DỤNG (NGẮN GỌN)

### **3 Thành phần chính:**

```
[TRÌNH DUYỆT]          [SERVER]              [DATABASE]
   React      ←HTTP→   Node.js    ←Query→     MySQL
 (Giao diện)         (Xử lý logic)        (Lưu dữ liệu)
```

### **Ngôn ngữ lập trình:**
- 🟨 **JavaScript** - Ngôn ngữ duy nhất cho cả Frontend & Backend
  - Frontend: React (làm giao diện web động)
  - Backend: Node.js + Express (xây dựng API server)

### **Cơ sở dữ liệu:**
- 🗄️ **MySQL** - Lưu trữ dữ liệu (bệnh nhân, lịch hẹn, hồ sơ...)

### **Thư viện quan trọng:**
| Thư viện | Công dụng |
|----------|-----------|
| **axios** | Gọi API từ Frontend sang Backend |
| **jsonwebtoken** | Xác thực đăng nhập (JWT) |
| **bcryptjs** | Mã hóa mật khẩu |
| **qrcode** | Tạo mã QR |
| **html5-qrcode** | Quét mã QR bằng camera |
| **helmet** | Bảo mật HTTP headers |

### **Phương pháp phát triển:**
- 🏗️ **Kiến trúc:** Client-Server (3-tier)
- 🔐 **Bảo mật:** JWT Authentication + Role-based Authorization
- 🧪 **Testing:** Jest (Unit tests) + Supertest (API tests)
- � **Spec-driven:** Requirements → Design → Tasks → Code

---

## 🔄 QUY TRÌNH HOẠT ĐỘNG (VÍ DỤ)

**Một bệnh nhân đi khám:**

```
1. ĐẶT LỊCH (Ở nhà)
   → Vào website → Chọn bác sĩ + ngày + giờ
   → Hệ thống gửi email kèm QR code

2. CHECK-IN (Tại phòng khám)
   → Bệnh nhân đến → Mở app hiện QR
   → Lễ tân quét QR → Check-in xong!

3. KHÁM BỆNH
   → Bác sĩ khám → Nhập triệu chứng + chẩn đoán
   → Kê đơn thuốc → Đặt lịch tái khám (nếu cần)

4. XEM HỒ SƠ (Về nhà)
   → Login website → Xem lại đơn thuốc, chẩn đoán
   → In đơn → Mua thuốc ở nhà thuốc
```

---

## 📊 DỮ LIỆU LƯU TRỮ

**10 bảng trong MySQL:**

1. **users** - Người dùng (bệnh nhân, bác sĩ, lễ tân, admin)
2. **departments** - 8 chuyên khoa (Tim Mạch, Nhi, Sản...)
3. **doctors** - Thông tin bác sĩ
4. **appointments** - Lịch hẹn (có mã QR)
5. **medical_records** - Hồ sơ bệnh án
6. **prescriptions** - Đơn thuốc
7. **auth_audit_logs** - Nhật ký đăng nhập
8. **user_sessions** - Phiên đăng nhập
9-10. *(Các bảng hỗ trợ khác)*

---

## 🎯 TÍNH NĂNG NỔI BẬT

### 1. 📱 QR Check-in (Tính năng ngầu nhất!)
- Tạo QR tự động khi đặt lịch
- Quét QR = check-in ngay, không cần form giấy
- **Công nghệ:** qrcode (Node.js) + html5-qrcode (React)

### 2. 📋 Hồ sơ y tế điện tử
- Lưu trọn đời, xem mọi lúc mọi nơi
- Bác sĩ xem lịch sử để chẩn đoán chính xác

### 3. 🔐 Bảo mật cao
- Mật khẩu mã hóa bcrypt (không ai xem được)
- JWT token hết hạn sau 24h
- Giới hạn 5 lần đăng nhập sai → khóa tài khoản

---

## 🚀 CÁCH CHẠY HỆ THỐNG

### Bước 1: Cài XAMPP + Node.js
- Tải XAMPP: https://www.apachefriends.org/
- Tải Node.js: https://nodejs.org/

### Bước 2: Tạo Database
1. Mở XAMPP → Start MySQL
2. Vào http://localhost/phpmyadmin
3. Import file: `database/kltn_clinic.sql`

### Bước 3: Chạy Backend
```bash
cd backend
npm install
npm start       # Server chạy ở port 5000
```

### Bước 4: Chạy Frontend
```bash
cd frontend
npm install
npm start       # Website mở ở port 3000
```

### Bước 5: Đăng nhập thử
```
Bệnh nhân: chitung@gmail.com / Password123!
Bác sĩ: bsphong@clinic.com / Password123!
Lễ tân: letan@gmail.com / Password123!
Admin: admin@clinic.com / Password123!
```

---

## 📁 CẤU TRÚC DỰ ÁN (ĐƠN GIẢN)

```
KLTN/
├── backend/              # Server (Node.js + Express)
│   ├── src/
│   │   ├── controllers/     # Xử lý logic (auth, appointments, medical records...)
│   │   ├── routes/          # Định nghĩa API (25+ endpoints)
│   │   ├── middleware/      # Xác thực JWT, bảo mật
│   │   └── server.js        # File chạy server
│   └── .env              # Config: database password, JWT secret...
│
├── frontend/             # Website (React)
│   ├── src/
│   │   ├── components/      # Giao diện (Login, Dashboard, QR Scanner...)
│   │   ├── contexts/        # AuthContext (quản lý đăng nhập)
│   │   └── App.js           # File chính
│   └── public/           # Images, logo
│
├── database/             # SQL scripts
│   └── kltn_clinic.sql   # Schema + dữ liệu mẫu (12 users, 8 khoa, 6 bác sĩ)
│
├── docs/                 # Tài liệu
└── README.md             # File này
```

---

## 📊 THỐNG KÊ

- **Số dòng code:** ~15,000 dòng
- **Số file:** ~150 files
- **API endpoints:** 25+ endpoints
- **Màn hình:** 10+ screens
- **Thời gian:** 3-4 tháng
- **Người làm:** 2 sinh viên

---

## 🎓 TÓM TẮT

### Công nghệ:
- **Ngôn ngữ:** JavaScript (100%)
- **Frontend:** React 18.2.0
- **Backend:** Node.js + Express 4.19.2
- **Database:** MySQL 8.0

### Phương pháp:
- **Kiến trúc:** Client-Server (3-tier)
- **Bảo mật:** JWT + bcrypt + Rate Limiting
- **Testing:** Jest + Supertest
- **Phát triển:** Spec-driven (Requirements → Design → Tasks → Code)

### Tính năng đặc biệt:
- ✅ QR Check-in (html5-qrcode)
- ✅ Hồ sơ y tế điện tử
- ✅ Đặt lịch thông minh
- ✅ 4 vai trò phân quyền rõ ràng

---

**💡 MÔ TẢ 1 DÒNG:**  
*"Website quản lý phòng khám với đặt lịch online, QR check-in và hồ sơ điện tử - React + Node.js + MySQL"*

---

**Made with ❤️ by THCT Clinic Team | Version 1.0.0 | 2026**
