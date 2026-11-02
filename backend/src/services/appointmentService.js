const db = require('../config/database');
const qrService = require('./qrService');

/**
 * Appointment Service - Business logic for appointment management
 * 
 * Handles:
 * - Appointment creation with QR code generation
 * - Slot availability checking
 * - Appointment ownership validation
 * - Status updates with validation
 * - Database transaction management
 * 
 * Requirements: 3.1-3.8, 24.1
 */

class AppointmentService {
  /**
   * Check if a time slot is available for booking
   * 
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Appointment date (YYYY-MM-DD)
   * @param {string} timeSlot - Time slot (HH:MM-HH:MM)
   * @returns {Promise<boolean>} True if slot is available
   * 
   * Requirement 3.4: Prevent double-booking by validating slot availability
   */
  async checkSlotAvailability(doctorId, date, timeSlot) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM appointments
        WHERE doctor_id = ?
          AND appointment_date = ?
          AND time_slot = ?
          AND status IN ('booked', 'checked_in')
      `;

      const [results] = await db.pool.execute(query, [doctorId, date, timeSlot]);
      
      return results[0].count === 0;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      throw new Error('Failed to check slot availability');
    }
  }

  /**
   * Create a new appointment with transaction support
   * 
   * @param {Object} data - Appointment data
   * @param {number} data.patientId - Patient user ID
   * @param {number} data.doctorId - Doctor ID
   * @param {string} data.appointmentDate - Date (YYYY-MM-DD)
   * @param {string} data.timeSlot - Time slot (HH:MM-HH:MM)
   * @returns {Promise<Object>} Created appointment with QR code
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 24.1
   */
  async createAppointment(data) {
    const { patientId, doctorId, appointmentDate, timeSlot } = data;

    return await db.transaction(async (connection) => {
      // 1. Check slot availability (with row lock)
      const slotCheckQuery = `
        SELECT COUNT(*) as count
        FROM appointments
        WHERE doctor_id = ?
          AND appointment_date = ?
          AND time_slot = ?
          AND status IN ('booked', 'checked_in')
        FOR UPDATE
      `;

      const [slotResults] = await connection.execute(
        slotCheckQuery,
        [doctorId, appointmentDate, timeSlot]
      );

      if (slotResults[0].count > 0) {
        throw new Error('SLOT_NOT_AVAILABLE');
      }

      // 2. Generate unique QR code token
      let qrCodeToken;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        qrCodeToken = qrService.generateUniqueToken();
        
        // Check uniqueness within transaction
        const [tokenCheck] = await connection.execute(
          'SELECT COUNT(*) as count FROM appointments WHERE qr_code_token = ?',
          [qrCodeToken]
        );

        if (tokenCheck[0].count === 0) {
          break; // Token is unique
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique QR code token');
        }
      }

      // 3. Insert appointment
      const insertQuery = `
        INSERT INTO appointments 
        (patient_id, doctor_id, appointment_date, time_slot, qr_code_token, status)
        VALUES (?, ?, ?, ?, ?, 'booked')
      `;

      const [insertResult] = await connection.execute(insertQuery, [
        patientId,
        doctorId,
        appointmentDate,
        timeSlot,
        qrCodeToken
      ]);

      const appointmentId = insertResult.insertId;

      // 4. Fetch complete appointment details
      const fetchQuery = `
        SELECT 
          a.id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.time_slot,
          a.qr_code_token,
          a.status,
          a.created_at,
          u.fullname as patient_name,
          u.phone as patient_phone,
          u.email as patient_email,
          du.fullname as doctor_name,
          d.degree as doctor_degree,
          dep.name as department_name,
          dep.id as department_id
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users du ON d.user_id = du.id
        JOIN departments dep ON d.department_id = dep.id
        WHERE a.id = ?
      `;

      const [appointmentResults] = await connection.execute(fetchQuery, [appointmentId]);
      const appointment = appointmentResults[0];

      // 5. Generate QR code image
      const qrCodeImage = await qrService.generateQRCode(qrCodeToken);

      return {
        ...appointment,
        qr_code: qrCodeImage
      };
    });
  }

  /**
   * Get appointment by ID with full details
   * 
   * @param {number} id - Appointment ID
   * @returns {Promise<Object|null>} Appointment details or null
   * 
   * Requirement 3.5: Return appointment details
   */
  async getAppointmentById(id) {
    try {
      const query = `
        SELECT 
          a.id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.time_slot,
          a.qr_code_token,
          a.status,
          a.created_at,
          u.fullname as patient_name,
          u.phone as patient_phone,
          u.email as patient_email,
          du.fullname as doctor_name,
          d.degree as doctor_degree,
          dep.name as department_name,
          dep.id as department_id
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users du ON d.user_id = du.id
        JOIN departments dep ON d.department_id = dep.id
        WHERE a.id = ?
      `;

      const [results] = await db.pool.execute(query, [id]);
      
      if (results.length === 0) {
        return null;
      }

      const appointment = results[0];

      // Generate QR code if status is booked
      if (appointment.status === 'booked') {
        const qrCodeImage = await qrService.generateQRCode(appointment.qr_code_token);
        appointment.qr_code = qrCodeImage;
      }

      return appointment;
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      throw new Error('Failed to retrieve appointment');
    }
  }

  /**
   * Get appointments for a patient
   * 
   * @param {number} patientId - Patient user ID
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status
   * @param {string} options.dateFrom - Filter from date
   * @param {string} options.dateTo - Filter to date
   * @returns {Promise<Array>} List of appointments
   * 
   * Requirement 5.1: Retrieve all appointments for patient
   */
  async getPatientAppointments(patientId, options = {}) {
    try {
      let query = `
        SELECT 
          a.id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.time_slot,
          a.qr_code_token,
          a.status,
          a.created_at,
          du.fullname as doctor_name,
          d.degree as doctor_degree,
          dep.name as department_name,
          dep.id as department_id
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users du ON d.user_id = du.id
        JOIN departments dep ON d.department_id = dep.id
        WHERE a.patient_id = ?
      `;

      const params = [patientId];

      // Add status filter
      if (options.status) {
        query += ' AND a.status = ?';
        params.push(options.status);
      }

      // Add date range filter
      if (options.dateFrom) {
        query += ' AND a.appointment_date >= ?';
        params.push(options.dateFrom);
      }

      if (options.dateTo) {
        query += ' AND a.appointment_date <= ?';
        params.push(options.dateTo);
      }

      query += ' ORDER BY a.appointment_date DESC, a.time_slot DESC';

      const [results] = await db.pool.execute(query, params);

      // Generate QR codes for booked appointments
      const appointmentsWithQR = await Promise.all(
        results.map(async (appointment) => {
          if (appointment.status === 'booked') {
            const qrCodeImage = await qrService.generateQRCode(appointment.qr_code_token);
            return { ...appointment, qr_code: qrCodeImage };
          }
          return appointment;
        })
      );

      return appointmentsWithQR;
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw new Error('Failed to retrieve patient appointments');
    }
  }

  /**
   * Validate appointment ownership
   * 
   * @param {number} appointmentId - Appointment ID
   * @param {number} patientId - Patient user ID
   * @returns {Promise<boolean>} True if patient owns appointment
   * 
   * Requirement 6.5, 7.6: Verify patient owns appointment
   */
  async validateAppointmentOwnership(appointmentId, patientId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM appointments
        WHERE id = ? AND patient_id = ?
      `;

      const [results] = await db.pool.execute(query, [appointmentId, patientId]);
      
      return results[0].count > 0;
    } catch (error) {
      console.error('Error validating appointment ownership:', error);
      throw new Error('Failed to validate appointment ownership');
    }
  }

  /**
   * Update appointment status with validation
   * 
   * @param {number} id - Appointment ID
   * @param {string} newStatus - New status
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated appointment
   * 
   * Requirement 3.6, 6.1, 9.4: Update status with validation
   */
  async updateAppointmentStatus(id, newStatus, options = {}) {
    try {
      // Get current appointment
      const appointment = await this.getAppointmentById(id);
      
      if (!appointment) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }

      // Validate status transition
      const validTransitions = {
        'booked': ['checked_in', 'cancelled'],
        'checked_in': ['completed'],
        'completed': [],
        'cancelled': []
      };

      const allowedStatuses = validTransitions[appointment.status] || [];
      
      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`INVALID_STATUS_TRANSITION: Cannot change from ${appointment.status} to ${newStatus}`);
      }

      // Update status
      const updateQuery = `
        UPDATE appointments
        SET status = ?
        WHERE id = ?
      `;

      await db.pool.execute(updateQuery, [newStatus, id]);

      // Return updated appointment
      return await this.getAppointmentById(id);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   * 
   * @param {number} appointmentId - Appointment ID
   * @param {number} patientId - Patient user ID (for ownership validation)
   * @returns {Promise<Object>} Updated appointment
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  async cancelAppointment(appointmentId, patientId) {
    try {
      // Validate ownership
      const ownsAppointment = await this.validateAppointmentOwnership(appointmentId, patientId);
      
      if (!ownsAppointment) {
        throw new Error('UNAUTHORIZED: You do not own this appointment');
      }

      // Get appointment details
      const appointment = await this.getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }

      // Check if status is booked
      if (appointment.status !== 'booked') {
        throw new Error(`CANNOT_CANCEL: Appointment with status '${appointment.status}' cannot be cancelled`);
      }

      // Check if appointment is in the future or today
      const appointmentDate = new Date(appointment.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        throw new Error('CANNOT_CANCEL: Cannot cancel past appointments');
      }

      // Update status to cancelled
      return await this.updateAppointmentStatus(appointmentId, 'cancelled');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Reschedule an appointment
   * 
   * @param {number} appointmentId - Appointment ID
   * @param {number} patientId - Patient user ID
   * @param {Object} newSchedule - New schedule details
   * @param {string} newSchedule.appointmentDate - New date
   * @param {string} newSchedule.timeSlot - New time slot
   * @returns {Promise<Object>} Updated appointment
   * 
   * Requirements: 7.1-7.7
   */
  async rescheduleAppointment(appointmentId, patientId, newSchedule) {
    const { appointmentDate, timeSlot } = newSchedule;

    return await db.transaction(async (connection) => {
      // 1. Validate ownership
      const [ownershipCheck] = await connection.execute(
        'SELECT patient_id, doctor_id, status FROM appointments WHERE id = ? FOR UPDATE',
        [appointmentId]
      );

      if (ownershipCheck.length === 0) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }

      const appointment = ownershipCheck[0];

      if (appointment.patient_id !== patientId) {
        throw new Error('UNAUTHORIZED: You do not own this appointment');
      }

      // 2. Check if status is booked
      if (appointment.status !== 'booked') {
        throw new Error(`CANNOT_RESCHEDULE: Appointment with status '${appointment.status}' cannot be rescheduled`);
      }

      // 3. Check new slot availability
      const [slotCheck] = await connection.execute(
        `SELECT COUNT(*) as count
         FROM appointments
         WHERE doctor_id = ?
           AND appointment_date = ?
           AND time_slot = ?
           AND status IN ('booked', 'checked_in')
           AND id != ?`,
        [appointment.doctor_id, appointmentDate, timeSlot, appointmentId]
      );

      if (slotCheck[0].count > 0) {
        throw new Error('SLOT_NOT_AVAILABLE');
      }

      // 4. Update appointment
      await connection.execute(
        `UPDATE appointments
         SET appointment_date = ?, time_slot = ?
         WHERE id = ?`,
        [appointmentDate, timeSlot, appointmentId]
      );

      // 5. Fetch updated appointment
      const [updatedResults] = await connection.execute(
        `SELECT 
           a.id,
           a.patient_id,
           a.doctor_id,
           a.appointment_date,
           a.time_slot,
           a.qr_code_token,
           a.status,
           a.created_at,
           u.fullname as patient_name,
           du.fullname as doctor_name,
           dep.name as department_name
         FROM appointments a
         JOIN users u ON a.patient_id = u.id
         JOIN doctors d ON a.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         JOIN departments dep ON d.department_id = dep.id
         WHERE a.id = ?`,
        [appointmentId]
      );

      const updatedAppointment = updatedResults[0];

      // 6. Generate QR code
      const qrCodeImage = await qrService.generateQRCode(updatedAppointment.qr_code_token);
      updatedAppointment.qr_code = qrCodeImage;

      return updatedAppointment;
    });
  }

  /**
   * Get available time slots for a doctor on a specific date
   * 
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<Array>} List of available slots
   * 
   * Requirement 2.1: Display all time slots with availability status
   */
  async getAvailableSlots(doctorId, date) {
    try {
      // Define clinic working hours and slot duration
      const slots = [
        '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00',
        '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
        '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00',
        '16:00-16:30', '16:30-17:00'
      ];

      // Get booked slots
      const query = `
        SELECT time_slot
        FROM appointments
        WHERE doctor_id = ?
          AND appointment_date = ?
          AND status IN ('booked', 'checked_in')
      `;

      const [bookedSlots] = await db.pool.execute(query, [doctorId, date]);
      const bookedTimeSlots = bookedSlots.map(row => row.time_slot);

      // Check if date is today to filter past time slots
      const selectedDate = new Date(date);
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();
      const currentTime = today.getHours() * 60 + today.getMinutes(); // Current time in minutes

      // Mark availability
      const availableSlots = slots.map(slot => {
        const isBooked = bookedTimeSlots.includes(slot);
        let isPast = false;

        if (isToday) {
          // Parse slot start time
          const [startTime] = slot.split('-');
          const [hours, minutes] = startTime.split(':').map(Number);
          const slotTimeInMinutes = hours * 60 + minutes;
          isPast = slotTimeInMinutes < currentTime;
        }

        return {
          time_slot: slot,
          available: !isBooked && !isPast,
          booked: isBooked,
          past: isPast
        };
      });

      return availableSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw new Error('Failed to retrieve available slots');
    }
  }
}

// Export singleton instance
module.exports = new AppointmentService();
