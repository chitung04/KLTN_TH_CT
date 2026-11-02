const db = require('../config/database');

/**
 * Queue Controller - Manages doctor patient queues
 * 
 * Handles:
 * - Retrieving doctor's patient queue (checked-in appointments)
 * - Queue ordering by check-in time
 * - Patient queue position tracking
 * 
 * Requirements: 11.1-11.5, 12.1-12.6
 */

class QueueController {
  /**
   * Get queue for a specific doctor
   * Returns all checked-in appointments ordered by check-in time
   * 
   * GET /api/queue/doctor/:doctorId
   * 
   * Requirements: 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.6, 7.3
   */
  async getQueueForDoctor(req, res) {
    try {
      const { doctorId } = req.params;
      const requestingUserId = req.user.id;
      const requestingUserRole = req.user.role;

      // Authorization: doctor can only view their own queue (Requirement 7.3)
      // admin can view any doctor's queue
      if (requestingUserRole === 'doctor') {
        // Verify the requesting doctor owns this queue - filter by authenticated doctor
        const [doctorCheck] = await db.pool.execute(
          'SELECT id FROM doctors WHERE id = ? AND user_id = ?',
          [doctorId, requestingUserId]
        );

        if (doctorCheck.length === 0) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Bạn chỉ có thể xem hàng đợi của mình'
            }
          });
        }
      }

      // Get doctor information
      const [doctorInfo] = await db.pool.execute(
        `SELECT 
          d.id,
          u.fullname as doctor_name,
          d.degree,
          dep.name as department_name
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        JOIN departments dep ON d.department_id = dep.id
        WHERE d.id = ?`,
        [doctorId]
      );

      if (doctorInfo.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Không tìm thấy bác sĩ'
          }
        });
      }

      // Get queue (all checked-in appointments for today)
      const queueQuery = `
        SELECT 
          a.id as appointment_id,
          a.patient_id,
          a.appointment_date,
          a.time_slot,
          a.status,
          a.created_at as checked_in_time,
          u.fullname as patient_name,
          u.phone as patient_phone,
          u.email as patient_email,
          mr.symptoms
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        LEFT JOIN medical_records mr ON a.id = mr.appointment_id
        WHERE a.doctor_id = ?
          AND a.status = 'checked_in'
          AND a.appointment_date = CURDATE()
        ORDER BY a.created_at ASC
      `;

      const [queueResults] = await db.pool.execute(queueQuery, [doctorId]);

      // Add position number to each queue entry
      const queueWithPositions = queueResults.map((entry, index) => ({
        ...entry,
        queue_position: index + 1
      }));

      res.json({
        success: true,
        doctor: {
          id: doctorInfo[0].id,
          name: doctorInfo[0].doctor_name,
          degree: doctorInfo[0].degree,
          department: doctorInfo[0].department_name
        },
        queue: queueWithPositions,
        queue_count: queueWithPositions.length,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error getting doctor queue:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể lấy hàng đợi. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Get queue position for a specific patient/appointment
   * 
   * GET /api/queue/position/:appointmentId
   * 
   * Requirements: 12.4
   */
  async getQueuePosition(req, res) {
    try {
      const { appointmentId } = req.params;

      // Get appointment details
      const [appointmentResults] = await db.pool.execute(
        `SELECT 
          a.id,
          a.doctor_id,
          a.patient_id,
          a.status,
          a.appointment_date,
          a.created_at,
          u.fullname as patient_name,
          du.fullname as doctor_name
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users du ON d.user_id = du.id
        WHERE a.id = ?`,
        [appointmentId]
      );

      if (appointmentResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Không tìm thấy lịch hẹn'
          }
        });
      }

      const appointment = appointmentResults[0];

      if (appointment.status !== 'checked_in') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NOT_IN_QUEUE',
            message: 'Lịch hẹn chưa check-in hoặc đã hoàn thành'
          }
        });
      }

      // Count how many appointments are ahead in the queue
      const [positionResults] = await db.pool.execute(
        `SELECT COUNT(*) as position
        FROM appointments
        WHERE doctor_id = ?
          AND status = 'checked_in'
          AND appointment_date = CURDATE()
          AND created_at < ?`,
        [appointment.doctor_id, appointment.created_at]
      );

      const position = positionResults[0].position + 1; // +1 because this patient is also in queue

      // Get total queue count
      const [countResults] = await db.pool.execute(
        `SELECT COUNT(*) as total
        FROM appointments
        WHERE doctor_id = ?
          AND status = 'checked_in'
          AND appointment_date = CURDATE()`,
        [appointment.doctor_id]
      );

      const totalInQueue = countResults[0].total;

      res.json({
        success: true,
        appointment: {
          id: appointment.id,
          patient_name: appointment.patient_name,
          doctor_name: appointment.doctor_name
        },
        queue_position: position,
        total_in_queue: totalInQueue,
        patients_ahead: position - 1
      });
    } catch (error) {
      console.error('Error getting queue position:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể lấy vị trí hàng đợi. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Remove appointment from queue (called after completion)
   * This is handled automatically when appointment status changes to 'completed'
   * 
   * POST /api/queue/remove/:appointmentId
   * 
   * Requirements: 11.5
   */
  async removeFromQueue(req, res) {
    try {
      const { appointmentId } = req.params;

      // Get appointment details
      const [appointmentResults] = await db.pool.execute(
        'SELECT id, status FROM appointments WHERE id = ?',
        [appointmentId]
      );

      if (appointmentResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Không tìm thấy lịch hẹn'
          }
        });
      }

      const appointment = appointmentResults[0];

      if (appointment.status !== 'checked_in') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NOT_IN_QUEUE',
            message: 'Lịch hẹn không ở trong hàng đợi'
          }
        });
      }

      // Update status to completed (this removes from queue)
      await db.pool.execute(
        'UPDATE appointments SET status = ? WHERE id = ?',
        ['completed', appointmentId]
      );

      res.json({
        success: true,
        message: 'Đã xóa khỏi hàng đợi'
      });
    } catch (error) {
      console.error('Error removing from queue:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể xóa khỏi hàng đợi. Vui lòng thử lại sau.'
        }
      });
    }
  }

  /**
   * Get queue statistics for a doctor
   * 
   * GET /api/queue/stats/:doctorId
   */
  async getQueueStats(req, res) {
    try {
      const { doctorId } = req.params;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_in_queue,
          MIN(a.created_at) as first_checkin_time,
          MAX(a.created_at) as last_checkin_time
        FROM appointments a
        WHERE a.doctor_id = ?
          AND a.status = 'checked_in'
          AND a.appointment_date = CURDATE()
      `;

      const [statsResults] = await db.pool.execute(statsQuery, [doctorId]);
      const stats = statsResults[0];

      // Calculate estimated wait time (rough estimate: 15 minutes per patient)
      const estimatedWaitTimeMinutes = stats.total_in_queue * 15;

      res.json({
        success: true,
        stats: {
          total_in_queue: stats.total_in_queue,
          first_checkin_time: stats.first_checkin_time,
          last_checkin_time: stats.last_checkin_time,
          estimated_wait_time_minutes: estimatedWaitTimeMinutes
        }
      });
    } catch (error) {
      console.error('Error getting queue stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Không thể lấy thống kê hàng đợi. Vui lòng thử lại sau.'
        }
      });
    }
  }
}

// Export singleton instance
module.exports = new QueueController();
