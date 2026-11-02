# 📋 MÔ TẢ ĐỀ TÀI

## **TÊN ĐỀ TÀI**
**"Xây dựng Hệ thống Đặt lịch Khám bệnh và Quản lý Hồ sơ Y tế Điện tử cho Bệnh Viện"**

---

## 🎯 **MỤC TIÊU ĐỀ TÀI**

Đề tài được triển khai nhằm giải quyết ba vấn đề chính tại các cơ sở y tế:

1. **Giải quyết tình trạng quá tải** tại bệnh viện
2. **Giảm thời gian chờ đợi** của bệnh nhân
3. **Nâng cao hiệu quả vận hành** tại các cơ sở y tế

---

## 🏥 **PHẠM VI & GIỚI HẠN**

### **Tập trung:**
- ✅ Quy trình **khám chữa bệnh ngoại trú**
- ✅ Số hóa toàn diện quy trình khám

### **Giới hạn:**
- ⛔ **KHÔNG** bao gồm quản lý nội trú
- ⛔ **KHÔNG** bao gồm tích hợp sâu với hệ thống cũ

### **Lý do giới hạn:**
- Đảm bảo tính thực tiễn
- Vừa sức triển khai
- Vẫn giải quyết triệt để bài toán chuyển đổi số dịch vụ y tế hiện nay

---

## 🔤 **CÔNG NGHỆ SỬ DỤNG**

### **Ngôn ngữ lập trình:**
- **JavaScript** (duy nhất cho cả Frontend và Backend)

### **Cấu trúc hệ thống:**
**Kiến trúc Client-Server (3 tầng):**

```
┌─────────────────────┐
│   FRONTEND (React)   │ ← Giao diện người dùng
│   JavaScript         │
└──────────┬──────────┘
           │ HTTP/REST API
┌──────────▼──────────┐
│  BACKEND (Node.js)   │ ← Xử lý logic nghiệp vụ
│  JavaScript/Express  │
└──────────┬──────────┘
           │ SQL Query
┌──────────▼──────────┐
│   DATABASE (MySQL)   │ ← Lưu trữ dữ liệu
│   Quan hệ (RDBMS)   │
└─────────────────────┘
```

### **Chi tiết công nghệ:**

| Thành phần | Công nghệ | Phiên bản | Vai trò |
|------------|-----------|-----------|---------|
| **Frontend** | React | 18.2.0 | Giao diện web động |
| **Backend** | Node.js + Express | 4.19.2 | REST API Server |
| **Database** | MySQL | 8.0 | Lưu trữ dữ liệu quan hệ |
| **Authentication** | JWT | 9.0.3 | Xác thực người dùng |
| **Password Hashing** | bcryptjs | 3.0.3 | Mã hóa mật khẩu |
| **QR Generation** | qrcode | 1.5.4 | Tạo mã QR |
| **QR Scanner** | html5-qrcode | 2.3.8 | Quét mã QR bằng camera |
| **HTTP Client** | Axios | 1.6.8 | Gọi API từ Frontend |
| **Security** | Helmet | 8.3.0 | Bảo mật HTTP headers |
| **Rate Limiting** | express-rate-limit | 8.7.0 | Chống DDoS/brute force |

---

## 🎯 **CHỨC NĂNG CHÍNH CỦA HỆ THỐNG**

### **1. GIẢI PHÁP SỐ HÓA TOÀN DIỆN CHO BỆNH NHÂN**

#### **1.1. Đặt lịch khám chủ động**
- Bệnh nhân tự đặt lịch qua website/app
- Chọn **chuyên khoa** (Tim Mạch, Nhi, Nội Tổng Quát...)
- Chọn **bác sĩ** phù hợp
- Chọn **khung giờ** phù hợp (hệ thống tự động kiểm tra giờ trống)

#### **1.2. Nhận mã QR check-in tự động**
- Sau khi đặt lịch, hệ thống tự động:
  - Tạo mã QR duy nhất
  - Gửi email xác nhận kèm QR code
  - Lưu QR trên thiết bị di động của bệnh nhân
- Bệnh nhân mang QR đến phòng khám để check-in nhanh

#### **1.3. Tra cứu hồ sơ bệnh án**
- Xem lịch sử khám bệnh đầy đủ
- Xem chi tiết từng lần khám:
  - Triệu chứng
  - Chẩn đoán của bác sĩ
  - Đơn thuốc chi tiết
  - Lịch tái khám (nếu có)
- In đơn thuốc để mua ở nhà thuốc

---

### **2. GIẢI PHÁP CHO LỄ TÂN (RECEPTIONIST)**

#### **2.1. Sử dụng mã QR để tiếp nhận**
- Quét QR code của bệnh nhân bằng camera
- Hệ thống tự động:
  - Xác thực lịch hẹn
  - Cập nhật trạng thái "Đã check-in"
  - Thêm vào hàng đợi bác sĩ

#### **2.2. Điều phối hàng đợi nhanh chóng**
- Xem danh sách bệnh nhân chờ khám
- Quản lý thứ tự ưu tiên
- Tra cứu thông tin bệnh nhân nhanh chóng

#### **2.3. Hỗ trợ bệnh nhân**
- Tra cứu hồ sơ của bất kỳ bệnh nhân nào
- Hỗ trợ đặt lịch cho người già/không biết sử dụng công nghệ
- In giấy xác nhận lịch hẹn

---

### **3. GIẢI PHÁP CHO BÁC SĨ (DOCTOR)**

#### **3.1. Tra cứu tiền sử bệnh lý**
- Xem **toàn bộ lịch sử khám** của bệnh nhân
- Xem các bệnh lý đã được chẩn đoán trước đó
- Xem các đơn thuốc cũ
- Giúp chẩn đoán chính xác hơn

#### **3.2. Ghi chép chẩn đoán**
- Nhập **triệu chứng** bệnh nhân
- Ghi **chẩn đoán** chi tiết
- Thêm **ghi chú** quan trọng
- Tất cả trên **phần mềm web quản trị**

#### **3.3. Kê đơn thuốc điện tử**
- Kê đơn thuốc ngay trên hệ thống:
  - Tên thuốc
  - Liều lượng (mg, viên...)
  - Số lượng
  - Hướng dẫn sử dụng
- Đơn thuốc tự động liên kết với hồ sơ bệnh án

#### **3.4. Đặt lịch tái khám**
- Đặt lịch hẹn tái khám cho bệnh nhân
- Ghi chú lý do tái khám
- Hệ thống tự động nhắc lịch

#### **3.5. Hoàn thành khám bệnh**
- Cập nhật trạng thái "Hoàn thành"
- Bệnh nhân có thể xem hồ sơ ngay lập tức

---

### **4. HỒ SƠ BỆNH ÁN ĐIỆN TỬ (ELECTRONIC HEALTH RECORD - EHR)**

#### **4.1. Lưu trữ dữ liệu tập trung**
- Toàn bộ dữ liệu khám bệnh được lưu vào **Hồ sơ Bệnh án Điện tử**
- Mỗi bệnh nhân có 1 hồ sơ duy nhất
- Bao gồm:
  - Thông tin cá nhân
  - Tất cả lần khám
  - Tất cả chẩn đoán
  - Tất cả đơn thuốc
  - Lịch sử tái khám

#### **4.2. Tra cứu tức thì và chính xác**
- Bác sĩ tra cứu lịch sử **tức thì**
- Không cần tìm kiếm hồ sơ giấy
- Đảm bảo **chính xác 100%**
- Giảm sai sót trong chẩn đoán

#### **4.3. Bảo mật cao**
- Phân quyền rõ ràng:
  - Bệnh nhân chỉ xem hồ sơ của mình
  - Bác sĩ chỉ xem bệnh nhân của mình
  - Lễ tân xem được tất cả (để hỗ trợ)
  - Admin quản lý toàn bộ hệ thống

---

### **5. DASHBOARD BÁO CÁO CHO BAN QUẢN LÝ**

#### **5.1. Theo dõi số lượng lượt khám**
- Thống kê lượt khám theo:
  - Ngày
  - Tuần
  - Tháng
  - Năm
- Biểu đồ trực quan
- So sánh giữa các thời kỳ

#### **5.2. Theo dõi doanh thu**
- Doanh thu theo chuyên khoa
- Doanh thu theo bác sĩ
- Doanh thu theo thời gian
- Xuất báo cáo Excel

#### **5.3. Thời gian thực (Real-time)**
- Cập nhật **liên tục**
- Không cần refresh trang
- Dữ liệu luôn mới nhất

#### **5.4. Trực quan**
- Biểu đồ cột, biểu đồ tròn
- Bảng thống kê chi tiết
- Giao diện thân thiện, dễ sử dụng

---

## 🔄 **QUY TRÌNH HOẠT ĐỘNG CỤ THỂ**

### **Scenario: Một bệnh nhân đi khám bệnh**

```
┌──────────────────────────────────────────────────────────┐
│ BƯỚC 1: ĐẶT LỊCH (Bệnh nhân ở nhà)                      │
├──────────────────────────────────────────────────────────┤
│ 1. Bệnh nhân truy cập website                            │
│ 2. Đăng nhập hoặc đăng ký tài khoản                      │
│ 3. Chọn "Đặt lịch khám"                                  │
│ 4. Chọn chuyên khoa: Ví dụ "Khoa Tim Mạch"              │
│ 5. Hệ thống hiển thị danh sách bác sĩ Tim Mạch          │
│ 6. Chọn bác sĩ: Ví dụ "BS. Nguyễn Văn Phong"           │
│ 7. Chọn ngày khám: Ví dụ "20/09/2026"                   │
│ 8. Hệ thống hiển thị khung giờ trống (8:00, 9:00...)    │
│ 9. Chọn giờ khám: Ví dụ "9:00-10:00"                    │
│ 10. Xác nhận đặt lịch                                    │
│ 11. Hệ thống:                                            │
│     - Tạo mã QR duy nhất                                 │
│     - Gửi email xác nhận + QR code                       │
│     - Lưu lịch hẹn với trạng thái "Đã đặt"              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ BƯỚC 2: CHECK-IN (Tại phòng khám)                       │
├──────────────────────────────────────────────────────────┤
│ 1. Bệnh nhân đến phòng khám đúng giờ                     │
│ 2. Mở app/email → Hiển thị mã QR                         │
│ 3. Đến quầy lễ tân                                       │
│ 4. Lễ tân mở chức năng "Quét QR"                        │
│ 5. Quét mã QR của bệnh nhân bằng camera                  │
│ 6. Hệ thống:                                             │
│     - Xác thực mã QR hợp lệ                              │
│     - Hiển thị thông tin bệnh nhân                       │
│     - Lễ tân xác nhận check-in                           │
│     - Cập nhật trạng thái "Đã check-in"                 │
│     - Thêm vào hàng đợi của bác sĩ                       │
│ 7. Bệnh nhân ngồi chờ gọi tên                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ BƯỚC 3: KHÁM BỆNH (Phòng khám)                          │
├──────────────────────────────────────────────────────────┤
│ 1. Bác sĩ đăng nhập hệ thống                             │
│ 2. Vào "Dashboard Bác sĩ"                                │
│ 3. Xem danh sách "Bệnh nhân đã check-in hôm nay"        │
│ 4. Thấy bệnh nhân trong danh sách chờ                    │
│ 5. Click "Bắt đầu khám"                                  │
│ 6. Hệ thống hiển thị:                                    │
│     - Thông tin bệnh nhân                                │
│     - Tiền sử bệnh lý (nếu có)                           │
│     - Lịch sử khám trước đó                              │
│ 7. Bác sĩ khám bệnh                                      │
│ 8. Ghi chép vào hệ thống:                                │
│     - Triệu chứng: "Đau ngực, khó thở, mệt mỏi"         │
│     - Chẩn đoán: "Huyết áp cao (Tăng huyết áp độ 2)"   │
│     - Ghi chú: "Cần theo dõi huyết áp hàng ngày"        │
│ 9. Kê đơn thuốc:                                         │
│     - Thuốc 1: Thuốc hạ huyết áp, 10mg, 1 viên/ngày     │
│     - Thuốc 2: Vitamin, 500mg, 1 viên/ngày              │
│     - Số lượng: 30 viên mỗi loại                         │
│ 10. Đặt lịch tái khám: "30/09/2026"                     │
│ 11. Click "Hoàn thành khám"                              │
│ 12. Hệ thống cập nhật trạng thái "Hoàn thành"           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ BƯỚC 4: XEM HỒ SƠ (Bệnh nhân về nhà)                   │
├──────────────────────────────────────────────────────────┤
│ 1. Bệnh nhân về nhà, mở website                          │
│ 2. Đăng nhập tài khoản                                   │
│ 3. Vào "Hồ sơ y tế"                                     │
│ 4. Thấy lịch sử khám bệnh (mới nhất → cũ nhất)          │
│ 5. Click vào lần khám hôm nay                            │
│ 6. Xem chi tiết:                                         │
│     - Ngày khám: 20/09/2026                              │
│     - Bác sĩ: BS. Nguyễn Văn Phong                      │
│     - Chuyên khoa: Tim Mạch                              │
│     - Triệu chứng: Đau ngực, khó thở...                  │
│     - Chẩn đoán: Huyết áp cao                            │
│     - Đơn thuốc chi tiết                                 │
│     - Lịch tái khám: 30/09/2026                         │
│ 7. Click "In đơn thuốc"                                  │
│ 8. Mang đơn đi mua thuốc ở nhà thuốc                     │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ **CẤU TRÚC CƠ SỞ DỮ LIỆU**

### **10 bảng dữ liệu chính:**

#### **1. users (Người dùng)**
Lưu thông tin tất cả người dùng hệ thống
- id, fullname, email, phone
- password (mã hóa bcrypt)
- role (patient/doctor/receptionist/admin)
- email_verified, last_login, login_attempts

#### **2. departments (Chuyên khoa)**
8 chuyên khoa
- Khoa Tim Mạch
- Khoa Nhi
- Khoa Nội Tổng Quát
- Khoa Sản - Phụ Khoa
- Khoa Ngoại Tổng Quát
- Khoa Da Liễu
- Khoa Mắt
- Khoa Tai Mũi Họng

#### **3. doctors (Bác sĩ)**
Thông tin bác sĩ
- user_id, department_id
- degree (học vị: Bác sĩ CK I, Thạc sĩ...)

#### **4. appointments (Lịch hẹn)**
Quản lý lịch khám
- patient_id, doctor_id
- appointment_date, time_slot
- qr_code_token (mã QR duy nhất)
- status (booked/checked_in/completed/cancelled)

#### **5. medical_records (Hồ sơ bệnh án)**
Lưu thông tin khám bệnh
- appointment_id
- symptoms (triệu chứng)
- diagnosis (chẩn đoán)
- note (ghi chú bác sĩ)
- reexamination_date (ngày tái khám)

#### **6. prescriptions (Đơn thuốc)**
Chi tiết đơn thuốc
- medical_record_id
- medicine_name, dosage
- quantity, instructions

#### **7. auth_audit_logs (Nhật ký bảo mật)**
Ghi lại hoạt động đăng nhập
- user_id, action
- ip_address, user_agent
- success/failure, timestamp

#### **8-10. Các bảng hỗ trợ khác**

### **Mối quan hệ dữ liệu:**

```
users ─┬─ (1:N) ─→ appointments ─ (1:1) ─→ medical_records ─ (1:N) ─→ prescriptions
       │
       └─ (1:1) ─→ doctors ─ (N:1) ─→ departments
```

---

## 🔐 **BẢO MẬT VÀ PHÂN QUYỀN**

### **1. Xác thực (Authentication)**
- **JWT Token:** Mã hóa thông tin người dùng
- Thời hạn: 24 giờ
- Tự động logout khi hết hạn

### **2. Mã hóa mật khẩu**
- Sử dụng **bcrypt** với salt rounds = 12
- Không ai xem được mật khẩu (kể cả admin)

### **3. Phân quyền (Authorization)**
4 vai trò với quyền hạn khác nhau:

| Vai trò | Quyền hạn |
|---------|-----------|
| **Patient** | Đặt lịch, xem hồ sơ của mình |
| **Receptionist** | Quét QR, xem tất cả hồ sơ, hỗ trợ đặt lịch |
| **Doctor** | Xem bệnh nhân của mình, tạo hồ sơ, kê đơn |
| **Admin** | Toàn quyền, xem báo cáo, quản lý hệ thống |

### **4. Chống tấn công**
- **Rate Limiting:** Giới hạn 5 lần đăng nhập sai/15 phút
- **IP Blocking:** Chặn IP tự động khi có hành vi bất thường
- **SQL Injection Prevention:** Sử dụng Parameterized Queries
- **XSS Protection:** Helmet.js bảo vệ HTTP headers

### **5. Nhật ký audit**
- Ghi lại mọi hoạt động đăng nhập
- Lưu IP address, thời gian
- Theo dõi login failures

---

## 📊 **KẾT QUẢ ĐẠT ĐƯỢC**

### **1. Giảm thời gian chờ đợi**
- ❌ **Trước:** Bệnh nhân xếp hàng 30-60 phút
- ✅ **Sau:** Check-in bằng QR < 30 giây

### **2. Giảm quá tải**
- ❌ **Trước:** Tập trung đông người vào buổi sáng
- ✅ **Sau:** Phân bổ đều theo khung giờ đã đặt

### **3. Tăng hiệu quả**
- ❌ **Trước:** Lễ tân nhập thủ công, bác sĩ tìm hồ sơ giấy
- ✅ **Sau:** Tự động hóa, tra cứu tức thì

### **4. Nâng cao chất lượng khám**
- ❌ **Trước:** Bác sĩ không rõ tiền sử, có thể chẩn đoán sai
- ✅ **Sau:** Xem đầy đủ lịch sử, chẩn đoán chính xác hơn

### **5. Quản lý tốt hơn**
- ❌ **Trước:** Không biết doanh thu, số lượt khám
- ✅ **Sau:** Dashboard real-time, báo cáo chi tiết

---

## 🎓 **Ý NGHĨA THỰC TIỄN**

### **1. Giải quyết bài toán chuyển đổi số**
- Đưa công nghệ vào y tế
- Hiện đại hóa quy trình
- Phù hợp xu hướng thế giới

### **2. Có thể triển khai thực tế**
- Phạm vi vừa phải (chỉ ngoại trú)
- Không yêu cầu tích hợp phức tạp
- Chi phí hợp lý

### **3. Mở rộng trong tương lai**
- Có thể thêm quản lý nội trú
- Có thể tích hợp với BHYT
- Có thể thêm telemedicine (khám từ xa)

---

## 📈 **THỐNG KÊ DỰ ÁN**

- **Thời gian thực hiện:** 3-4 tháng
- **Số dòng code:** ~15,000 dòng
- **Số chức năng:** 25+ API endpoints
- **Số màn hình:** 10+ screens
- **Số người thực hiện:** 2 sinh viên
- **Công nghệ:** 1 ngôn ngữ (JavaScript), 3 tầng (React-Node.js-MySQL)

---

## 💡 **KẾT LUẬN**

Đề tài **"Xây dựng Hệ thống Đặt lịch Khám bệnh và Quản lý Hồ sơ Y tế Điện tử cho Bệnh Viện"** là một giải pháp số hóa toàn diện cho quy trình khám ngoại trú, giúp:

✅ Giảm thời gian chờ đợi của bệnh nhân  
✅ Giải quyết tình trạng quá tải bệnh viện  
✅ Nâng cao hiệu quả vận hành  
✅ Số hóa hồ sơ bệnh án  
✅ Hỗ trợ bác sĩ chẩn đoán chính xác hơn  
✅ Giúp ban quản lý theo dõi real-time  

Hệ thống sử dụng công nghệ hiện đại (React + Node.js + MySQL), kiến trúc rõ ràng, bảo mật cao, có thể triển khai thực tế tại các phòng khám và bệnh viện.

---

**Khóa luận tốt nghiệp 2026**  
**Sinh viên:** Nguyễn Thu Hằng, Đỗ Chí Tùng  
**GVHD:** TS. Ngô Hữu Dũng

---

**© 2026 THCT Clinic Development Team. All rights reserved.**
