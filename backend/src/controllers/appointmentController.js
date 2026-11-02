const appointmentService = require('../services/appointmentService');
const qrService = require('../services/qrService');
const db = require('../config/database');
const validator = require('validator');

/**
 * Appointment Controller - Handles HTTP requests for appointment management
 * 
 * Endpoints:
 * - GET /api/appointments/doctors - Get departments and doctors list
 * - GET /api/appointments/slots - Get available time slots
 * - POST /api/appointments/create - Create new appointment
 * - GET /api/appointments/patient/:id - Get patient appointments
 * - PUT /api/appointments/:id/cancel - Cancel appointment
 * - PUT /api/appointments/:id/reschedule - Reschedule appointment
 * - POST /api/appointments/checkin - Check-in appointment with QR code
 * - POST /api/appointments/search - Manual patient lookup
 * 
 * Requirements: 1.1-1.3, 2.1-2.3, 3.1-3.8, 5.1-5.2, 6.1-6.4, 7.1-7.7, 9.1-9.6, 10.1-10.6, 22.1-22.8
 */

class AppointmentController {
  /**
   * Get list of departments and doctors
   * Public endpoint - no authentication required
   * 
   * GET /api/appointments/doctors
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  async getDoctorsAndDepartments(req, res) {
    try {
      // Get all departments
      const departmentsQuery = `
        SELECT 
          id,
          name,
          description
        FROM departments
        ORDER BY name
      `;

      const [departments] = await db.pool.execute(departmentsQuery);

      // Get all doctors with their user info
      const doctorsQuery = `
        SELECT 
          d.id as doctor_id,
          d.user_id,
          d.department_id,
          d.degree,
          u.fullname as full_name,
          u.email,
          u.phone,
          dep.name as department_name
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        JOIN departments dep ON d.department_id = dep.id
        WHERE u.role = 'doctor'
        ORDER BY dep.name, u.fullname
      `;

      const [doctors] = await db.pool.execute(doctorsQuery);

      // Group doctors by department
      const departmentsWithDoctors = departments.map(dept => {
        const deptDoctors = doctors.filter(doc => doc.department_id === dept.id);
        
        return {
          ...dept,
          doctor_count: deptDoctors.length,
          doctors: deptDoctors
        };
      });

      res.json({
        success: true,
        departments: departmentsWithDoctors,
        doctors: doctors
      });
    } catch (error) {
      console.error('Error getting doctors and departments:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể lấy danh sách bác sĩ và khoa. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   * Public/authenticated endpoint
   * 
   * GET /api/appointments/slots?doctorId=1&date=2026-10-25
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 22.1, 22.2, 22.3
   */
  async getAvailableSlots(req, res) {
    try {
      const { doctorId, date } = req.query;

      // Validation
      if (!doctorId || !date) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Thiếu thông tin doctor_id hoặc date',
            details: {
              doctorId: !doctorId ? 'Doctor ID is required' : undefined,
              date: !date ? 'Date is required' : undefined
            }
          }
        });
      }

      // Validate date format (YYYY-MM-DD)
      if (!validator.isDate(date, { format: 'YYYY-MM-DD', strictMode: true })) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'
          }
        });
      }

      // Check if date is in the past
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PAST_DATE',
            message: 'Không thể đặt lịch vào ngày đã qua'
          }
        });
      }

      // Validate doctor exists
      const [doctorCheck] = await db.pool.execute(
        'SELECT d.id, u.fullname, dep.name as department FROM doctors d JOIN users u ON d.user_id = u.id JOIN departments dep ON d.department_id = dep.id WHERE d.id = ?',
        [doctorId]
      );

      if (doctorCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Không tìm thấy bác sĩ'
          }
        });
      }

      const doctor = doctorCheck[0];

      // Get available slots
      const slots = await appointmentService.getAvailableSlots(doctorId, date);

      res.json({
        success: true,
        doctor: {
          id: doctorId,
          name: doctor.fullname,
          department: doctor.department
        },
        date: date,
        slots: slots
      });
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể lấy danh sách khung giờ. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Create a new appointment
   * Requires authentication (patient role)
   * 
   * POST /api/appointments/create
   * Body: { doctorId, appointmentDate, timeSlot }
   * 
   * Requirements: 3.1-3.8, 4.1-4.5, 7.1, 22.1-22.8
   */
  async createAppointment(req, res) {
    try {
      const { doctorId, appointmentDate, timeSlot } = req.body;
      
      // Get patient_id from authenticated user's JWT token (Requirement 7.1)
      const patientId = req.user.id; // From auth middleware

      // Validation
      const errors = {};

      if (!doctorId) errors.doctorId = 'Doctor ID is required';
      if (!appointmentDate) errors.appointmentDate = 'Appointment date is required';
      if (!timeSlot) errors.timeSlot = 'Time slot is required';

      // Validate date format
      if (appointmentDate && !validator.isDate(appointmentDate, { format: 'YYYY-MM-DD', strictMode: true })) {
        errors.appointmentDate = 'Invalid date format. Use YYYY-MM-DD';
      }

      // Validate time slot format (HH:MM-HH:MM)
      if (timeSlot && !/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/.test(timeSlot)) {
        errors.timeSlot = 'Invalid time slot format. Use HH:MM-HH:MM';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu đầu vào không hợp lệ',
            details: errors
          }
        });
      }

      // Check if date is not in the past
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PAST_APPOINTMENT',
            message: 'Không thể đặt lịch vào ngày đã qua'
          }
        });
      }

      // Validate doctor exists
      const [doctorCheck] = await db.pool.execute(
        'SELECT id FROM doctors WHERE id = ?',
        [doctorId]
      );

      if (doctorCheck.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Không tìm thấy bác sĩ'
          }
        });
      }

      // Create appointment
      const appointment = await appointmentService.createAppointment({
        patientId,
        doctorId,
        appointmentDate,
        timeSlot
      });

      console.log(`✅ Appointment created: ID ${appointment.id}, Patient: ${patientId}, Doctor: ${doctorId}`);

      res.status(201).json({
        success: true,
        message: 'Đặt lịch khám thành công!',
        appointment: {
          id: appointment.id,
          patient_id: appointment.patient_id,
          patient_name: appointment.patient_name,
          doctor_id: appointment.doctor_id,
          doctor_name: appointment.doctor_name,
          department: appointment.department_name,
          appointment_date: appointment.appointment_date,
          time_slot: appointment.time_slot,
          status: appointment.status,
          qr_code: appointment.qr_code,
          qr_code_token: appointment.qr_code_token,
          created_at: appointment.created_at
        }
      });
    } catch (error) {
      console.error('Error creating appointment:', error);

      if (error.message === 'SLOT_NOT_AVAILABLE') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SLOT_NOT_AVAILABLE',
            message: 'Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.',
            details: {
              doctorId: req.body.doctorId,
              date: req.body.appointmentDate,
              timeSlot: req.body.timeSlot
            }
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể tạo lịch hẹn. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Get appointments for a patient
   * Requires authentication (patient or staff role)
   * 
   * GET /api/appointments/patient/:id
   * 
   * Requirements: 5.1-5.7, 7.2
   */
  async getPatientAppointments(req, res) {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.id;
      const requestingUserRole = req.user.role;

      // Authorization: patient can only view their own appointments (Requirement 7.2)
      // staff (receptionist, doctor, admin) can view any patient's appointments
      if (requestingUserRole === 'patient' && parseInt(id) !== requestingUserId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Bạn chỉ có thể xem lịch hẹn của mình'
          }
        });
      }

      // Get appointments filtered by authenticated user (Requirement 7.2)
      const appointments = await appointmentService.getPatientAppointments(id);

      // Separate into upcoming and past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today;
      }).sort((a, b) => {
        // Sort ascending (earliest first)
        if (a.appointment_date !== b.appointment_date) {
          return new Date(a.appointment_date) - new Date(b.appointment_date);
        }
        return a.time_slot.localeCompare(b.time_slot);
      });

      const past = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate < today;
      }).sort((a, b) => {
        // Sort descending (most recent first)
        if (a.appointment_date !== b.appointment_date) {
          return new Date(b.appointment_date) - new Date(a.appointment_date);
        }
        return b.time_slot.localeCompare(a.time_slot);
      });

      res.json({
        success: true,
        appointments: {
          upcoming,
          past,
          total: appointments.length
        }
      });
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể lấy danh sách lịch hẹn. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Cancel an appointment
   * Requires authentication (patient role)
   * 
   * PUT /api/appointments/:id/cancel
   * 
   * Requirements: 6.1-6.6, 7.4
   */
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const patientId = req.user.id; // Get patient_id from authenticated user (Requirement 7.4)

      // Authentication check: patient can only cancel their own appointments
      const updatedAppointment = await appointmentService.cancelAppointment(id, patientId);

      console.log(`✅ Appointment cancelled: ID ${id}, Patient: ${patientId}`);

      res.json({
        success: true,
        message: 'Hủy lịch hẹn thành công',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);

      if (error.message.includes('UNAUTHORIZED')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Bạn không có quyền hủy lịch hẹn này'
          }
        });
      }

      if (error.message.includes('APPOINTMENT_NOT_FOUND')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Không tìm thấy lịch hẹn'
          }
        });
      }

      if (error.message.includes('CANNOT_CANCEL')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_CANCEL',
            message: error.message.replace('CANNOT_CANCEL: ', '')
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Reschedule an appointment
   * Requires authentication (patient role)
   * 
   * PUT /api/appointments/:id/reschedule
   * Body: { appointmentDate, timeSlot }
   * 
   * Requirements: 7.1-7.7, 7.4
   */
  async rescheduleAppointment(req, res) {
    try {
      const { id } = req.params;
      const { appointmentDate, timeSlot } = req.body;
      const patientId = req.user.id; // Get patient_id from authenticated user (Requirement 7.4)

      // Validation
      const errors = {};

      if (!appointmentDate) errors.appointmentDate = 'Appointment date is required';
      if (!timeSlot) errors.timeSlot = 'Time slot is required';

      if (appointmentDate && !validator.isDate(appointmentDate, { format: 'YYYY-MM-DD', strictMode: true })) {
        errors.appointmentDate = 'Invalid date format';
      }

      if (timeSlot && !/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/.test(timeSlot)) {
        errors.timeSlot = 'Invalid time slot format';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: errors
          }
        });
      }

      // Check if date is not in the past
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PAST_APPOINTMENT',
            message: 'Không thể đặt lịch vào ngày đã qua'
          }
        });
      }

      // Authentication check: patient can only reschedule their own appointments
      const updatedAppointment = await appointmentService.rescheduleAppointment(
        id,
        patientId,
        { appointmentDate, timeSlot }
      );

      console.log(`✅ Appointment rescheduled: ID ${id}, Patient: ${patientId}`);

      res.json({
        success: true,
        message: 'Đổi lịch hẹn thành công',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);

      if (error.message.includes('UNAUTHORIZED')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Bạn không có quyền đổi lịch hẹn này'
          }
        });
      }

      if (error.message === 'SLOT_NOT_AVAILABLE') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SLOT_NOT_AVAILABLE',
            message: 'Khung giờ mới đã có người đặt. Vui lòng chọn khung giờ khác.'
          }
        });
      }

      if (error.message.includes('CANNOT_RESCHEDULE')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_RESCHEDULE',
            message: error.message.replace('CANNOT_RESCHEDULE: ', '')
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể đổi lịch hẹn. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Check-in appointment using QR code
   * Requires authentication (receptionist or admin role)
   * 
   * POST /api/appointments/checkin
   * Body: { qrCodeToken }
   * 
   * Requirements: 9.1-9.7, 24.1, 7.4
   */
  async checkInAppointment(req, res) {
    try {
      const { qrCodeToken } = req.body;

      // Authentication check: only receptionist or admin can check-in (enforced by route middleware)
      // req.user contains authenticated user information
      if (!qrCodeToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Mã QR không được để trống'
          }
        });
      }

      // Verify token
      const verification = await qrService.verifyTokenForCheckIn(qrCodeToken);

      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QR_CODE',
            message: verification.reason,
            details: verification.appointment
          }
        });
      }

      // Update status to checked_in using transaction
      const updatedAppointment = await appointmentService.updateAppointmentStatus(
        verification.appointment.id,
        'checked_in'
      );

      console.log(`✅ Check-in successful: Appointment ${verification.appointment.id}, Patient: ${verification.appointment.patient_name}`);

      res.json({
        success: true,
        message: 'Check-in thành công!',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Error during check-in:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể check-in. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Manual patient lookup for check-in
   * Requires authentication (receptionist or admin role)
   * 
   * POST /api/appointments/search
   * Body: { searchType: 'name' | 'phone', searchValue: string }
   * 
   * Requirements: 10.1-10.6, 7.4
   */
  async searchPatients(req, res) {
    try {
      const { searchType, searchValue } = req.body;

      // Authentication check: only receptionist or admin can search (enforced by route middleware)
      // req.user contains authenticated user information
      if (!searchType || !searchValue) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Thiếu thông tin tìm kiếm'
          }
        });
      }

      let query = `
        SELECT 
          a.id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.time_slot,
          a.status,
          a.qr_code_token,
          u.fullname as patient_name,
          u.phone as patient_phone,
          du.fullname as doctor_name,
          dep.name as department_name
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users du ON d.user_id = du.id
        JOIN departments dep ON d.department_id = dep.id
        WHERE a.appointment_date = CURDATE()
          AND a.status = 'booked'
      `;

      const params = [];

      if (searchType === 'name') {
        query += ' AND u.fullname LIKE ?';
        params.push(`%${searchValue}%`);
      } else if (searchType === 'phone') {
        query += ' AND u.phone = ?';
        params.push(searchValue);
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Loại tìm kiếm không hợp lệ. Sử dụng "name" hoặc "phone"'
          }
        });
      }

      query += ' ORDER BY a.time_slot';

      const [results] = await db.pool.execute(query, params);

      res.json({
        success: true,
        count: results.length,
        appointments: results
      });
    } catch (error) {
      console.error('Error searching patients:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể tìm kiếm bệnh nhân. Vui lòng thử lại sau.'
        }
      });
    }
  }
}

// Export singleton instance
module.exports = new AppointmentController();
