-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 17, 2026 at 03:43 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kltn_clinic`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `time_slot` varchar(20) NOT NULL,
  `qr_code_token` varchar(255) NOT NULL,
  `status` enum('booked','checked_in','completed','cancelled') DEFAULT 'booked',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_audit_logs`
--

CREATE TABLE `auth_audit_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`) VALUES
(1, 'Khoa Khám Bệnh - Nội Tổng Quát', 'Khám và điều trị các bệnh lý nội khoa tổng quát.'),
(2, 'Khoa Tim Mạch', 'Chuyên khoa sâu về tim mạch và huyết áp.'),
(3, 'Khoa Ngoại Tổng Quát', 'Phẫu thuật và điều trị các bệnh lý ngoại khoa.'),
(4, 'Khoa Sản - Phụ Khoa', 'Chăm sóc sức khỏe phụ nữ, thai sản.'),
(5, 'Khoa Nhi', 'Khám và điều trị bệnh cho trẻ em.'),
(6, 'Khoa Da Liễu', 'Điều trị các bệnh về da, tóc, móng.'),
(7, 'Khoa Mắt', 'Khám và điều trị các bệnh về mắt.'),
(8, 'Khoa Tai - Mũi - Họng', 'Điều trị các bệnh lý về tai, mũi, họng.');

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `degree` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_records`
--

CREATE TABLE `medical_records` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `symptoms` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `reexamination_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL,
  `medical_record_id` int(11) DEFAULT NULL,
  `medicine_name` varchar(150) NOT NULL,
  `dosage` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `instructions` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('patient','receptionist','doctor','admin') DEFAULT 'patient',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email_verified` tinyint(1) DEFAULT 0,
  `last_login` timestamp NULL DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users`
--
-- Password cho tất cả users: "Password123!" (đã hash bằng bcrypt với salt rounds 12)
--

INSERT INTO `users` (`id`, `fullname`, `email`, `phone`, `password`, `role`, `created_at`, `email_verified`, `last_login`, `login_attempts`, `locked_until`, `password_reset_token`, `password_reset_expires`, `updated_at`) VALUES
(1, 'Đỗ Chí Tùng', 'chitung@gmail.com', '0901234567', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'patient', '2026-09-15 02:17:20', 1, NULL, 0, NULL, NULL, NULL, '2026-09-15 07:11:12'),
(2, 'Lễ Tân 01', 'letan@gmail.com', '0901234568', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'receptionist', '2026-09-15 02:17:20', 1, NULL, 0, NULL, NULL, NULL, '2026-09-15 07:11:12'),
(3, 'Nguyễn Văn An', 'vanan@gmail.com', '0912345678', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'patient', '2026-09-16 03:00:00', 1, '2026-09-17 02:30:00', 0, NULL, NULL, NULL, '2026-09-17 02:30:00'),
(4, 'Trần Thị Bình', 'thibinh@gmail.com', '0923456789', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'patient', '2026-09-16 04:00:00', 1, '2026-09-17 01:15:00', 0, NULL, NULL, NULL, '2026-09-17 01:15:00'),
(5, 'Lê Minh Châu', 'minhchau@gmail.com', '0934567890', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'patient', '2026-09-16 05:00:00', 1, NULL, 0, NULL, NULL, NULL, '2026-09-16 05:00:00'),
(6, 'BS. Nguyễn Văn Phong', 'bsphong@clinic.com', '0967890123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'doctor', '2026-09-14 01:00:00', 1, '2026-09-17 00:30:00', 0, NULL, NULL, NULL, '2026-09-17 00:30:00'),
(7, 'BS. Trần Thị Giang', 'bsgiang@clinic.com', '0978901234', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'doctor', '2026-09-14 02:00:00', 1, '2026-09-17 01:45:00', 0, NULL, NULL, NULL, '2026-09-17 01:45:00'),
(8, 'BS. Lê Minh Hiếu', 'bshieu@clinic.com', '0989012345', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'doctor', '2026-09-14 03:00:00', 1, '2026-09-16 09:00:00', 0, NULL, NULL, NULL, '2026-09-16 09:00:00'),
(9, 'ThS.BS. Phạm Thị Hoa', 'bshoa@clinic.com', '0990123456', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'doctor', '2026-09-14 04:00:00', 1, '2026-09-17 02:00:00', 0, NULL, NULL, NULL, '2026-09-17 02:00:00'),
(10, 'BS. Võ Văn Khánh', 'bskhanh@clinic.com', '0901234572', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'doctor', '2026-09-14 05:00:00', 1, '2026-09-16 08:00:00', 0, NULL, NULL, NULL, '2026-09-16 08:00:00'),
(11, 'BS. Hoàng Thị Lan', 'bslan@clinic.com', '0901234573', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'doctor', '2026-09-14 06:00:00', 1, '2026-09-16 07:00:00', 0, NULL, NULL, NULL, '2026-09-16 07:00:00'),
(12, 'Quản Trị Viên', 'admin@clinic.com', '0901234571', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbGkFwKzgWbKhL3qJGqS4UZrVJti', 'admin', '2026-09-15 01:00:00', 1, '2026-09-17 03:00:00', 0, NULL, NULL, NULL, '2026-09-17 03:00:00');

-- --------------------------------------------------------

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `user_id`, `department_id`, `degree`) VALUES
(1, 6, 1, 'Bác sĩ Chuyên khoa I'),
(2, 7, 2, 'Bác sĩ Chuyên khoa II'),
(3, 8, 3, 'Bác sĩ Đa khoa'),
(4, 9, 2, 'Thạc sĩ - Bác sĩ'),
(5, 10, 1, 'Bác sĩ Chuyên khoa I'),
(6, 11, 1, 'Bác sĩ Đa khoa');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `session_id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `qr_code_token` (`qr_code_token`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `auth_audit_logs`
--
ALTER TABLE `auth_audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_timestamp` (`timestamp`),
  ADD KEY `idx_audit_ip` (`ip_address`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `medical_record_id` (`medical_record_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_users_email_verified` (`email`,`email_verified`),
  ADD KEY `idx_users_reset_token` (`password_reset_token`),
  ADD KEY `idx_users_locked_until` (`locked_until`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `idx_user_sessions_user` (`user_id`),
  ADD KEY `idx_user_sessions_expires` (`expires_at`),
  ADD KEY `idx_user_sessions_token` (`token_hash`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_audit_logs`
--
ALTER TABLE `auth_audit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `medical_records`
--
ALTER TABLE `medical_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `auth_audit_logs`
--
ALTER TABLE `auth_audit_logs`
  ADD CONSTRAINT `auth_audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `doctors_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;