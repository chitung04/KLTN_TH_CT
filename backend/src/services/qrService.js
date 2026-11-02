const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../config/database');

/**
 * QR Service - Handles QR code generation and validation for appointments
 * 
 * This service provides:
 * - Unique token generation for QR codes (cryptographically secure)
 * - QR code image generation (base64 format)
 * - Token validation and verification
 * 
 * Requirements: 4.1, 4.2, 4.5, 25.1, 25.2, 25.5
 */

class QRService {
  /**
   * Generate a cryptographically secure unique token
   * Token length: 32+ characters (48 characters in base64)
   * 
   * @returns {string} Unique token string
   * 
   * Requirement 25.1: Create cryptographically random string of at least 32 characters
   */
  generateUniqueToken() {
    try {
      // Generate 32 random bytes and convert to base64url (URL-safe)
      // 32 bytes = 256 bits of entropy
      // Base64 encoding: 32 bytes -> 43-44 characters (padding removed)
      const token = crypto
        .randomBytes(32)
        .toString('base64url'); // base64url is URL-safe (no +, /, =)
      
      return token;
    } catch (error) {
      console.error('Error generating unique token:', error);
      throw new Error('Failed to generate QR code token');
    }
  }

  /**
   * Generate QR code image from token
   * Returns base64-encoded PNG image
   * 
   * @param {string} token - The token to encode in QR code
   * @returns {Promise<string>} Base64-encoded QR code image (data:image/png;base64,...)
   * 
   * Requirement 4.1: Generate unique QR code containing appointment token
   * Requirement 4.2: Encode qr_code_token value in QR code
   * Requirement 25.4: Use existing qrcode library
   */
  async generateQRCode(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token provided for QR code generation');
      }

      // QR code options
      const options = {
        errorCorrectionLevel: 'M', // Medium error correction (15%)
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 300, // 300x300 pixels
        color: {
          dark: '#000000',  // Black dots
          light: '#FFFFFF'  // White background
        }
      };

      // Generate QR code as base64 data URL
      const qrCodeDataURL = await QRCode.toDataURL(token, options);
      
      return qrCodeDataURL; // Returns: "data:image/png;base64,iVBORw0KGgo..."
    } catch (error) {
      console.error('Error generating QR code image:', error);
      throw new Error('Failed to generate QR code image');
    }
  }

  /**
   * Validate if a token exists in the database
   * 
   * @param {string} token - The QR code token to validate
   * @returns {Promise<Object|null>} Appointment object if token is valid, null otherwise
   * 
   * Requirement 25.5: Validate QR code tokens to prevent forged codes
   */
  async validateToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      // Query database to check if token exists
      const query = `
        SELECT 
          a.id,
          a.patient_id,
          a.doctor_id,
          a.appointment_date,
          a.time_slot,
          a.status,
          a.created_at,
          u.fullname as patient_name,
          u.phone as patient_phone,
          du.fullname as doctor_name,
          dep.name as department_name
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users du ON d.user_id = du.id
        JOIN departments dep ON d.department_id = dep.id
        WHERE a.qr_code_token = ?
      `;

      const [results] = await db.execute(query, [token]);

      if (results.length === 0) {
        return null; // Token not found
      }

      return results[0]; // Return appointment details
    } catch (error) {
      console.error('Error validating token:', error);
      throw new Error('Failed to validate QR code token');
    }
  }

  /**
   * Check if token is unique in database
   * Used before inserting new appointment
   * 
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} True if token is unique, false if already exists
   * 
   * Requirement 4.5: Ensure each QR code token is unique across all appointments
   * Requirement 25.2: Ensure qr_code_token uniqueness
   */
  async isTokenUnique(token) {
    try {
      const query = 'SELECT COUNT(*) as count FROM appointments WHERE qr_code_token = ?';
      const [results] = await db.execute(query, [token]);
      
      return results[0].count === 0;
    } catch (error) {
      console.error('Error checking token uniqueness:', error);
      throw new Error('Failed to check token uniqueness');
    }
  }

  /**
   * Generate a guaranteed unique token
   * Keeps generating until a unique token is found
   * 
   * @param {number} maxAttempts - Maximum number of attempts (default: 5)
   * @returns {Promise<string>} Unique token
   * 
   * Requirement 25.1: Create cryptographically random string
   * Requirement 25.2: Ensure uniqueness across all appointments
   */
  async generateGuaranteedUniqueToken(maxAttempts = 5) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const token = this.generateUniqueToken();
      const isUnique = await this.isTokenUnique(token);
      
      if (isUnique) {
        return token;
      }
      
      attempts++;
      console.warn(`Token collision detected (attempt ${attempts}/${maxAttempts}). Regenerating...`);
    }
    
    throw new Error('Failed to generate unique token after maximum attempts');
  }

  /**
   * Verify token can be used for check-in
   * Checks if token exists and appointment is in 'booked' status
   * 
   * @param {string} token - QR code token
   * @returns {Promise<Object>} { valid: boolean, appointment: Object|null, reason: string }
   * 
   * Requirement 9.2: Retrieve appointment matching qr_code_token
   * Requirement 25.5: Validate tokens during check-in
   * Requirement 25.6: Prevent reuse of tokens after completion/cancellation
   */
  async verifyTokenForCheckIn(token) {
    try {
      const appointment = await this.validateToken(token);
      
      if (!appointment) {
        return {
          valid: false,
          appointment: null,
          reason: 'QR code không hợp lệ hoặc không tồn tại'
        };
      }

      // Check if appointment can be checked in
      if (appointment.status !== 'booked') {
        let reason = '';
        
        switch (appointment.status) {
          case 'checked_in':
            reason = 'Lịch hẹn đã được check-in trước đó';
            break;
          case 'completed':
            reason = 'Lịch hẹn đã hoàn thành và không thể check-in lại';
            break;
          case 'cancelled':
            reason = 'Lịch hẹn đã bị hủy';
            break;
          default:
            reason = 'Lịch hẹn không thể check-in';
        }
        
        return {
          valid: false,
          appointment,
          reason
        };
      }

      // Check if appointment date is today or future
      const appointmentDate = new Date(appointment.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate > today) {
        return {
          valid: false,
          appointment,
          reason: 'Không thể check-in trước ngày hẹn'
        };
      }

      // All checks passed
      return {
        valid: true,
        appointment,
        reason: 'QR code hợp lệ'
      };
    } catch (error) {
      console.error('Error verifying token for check-in:', error);
      throw new Error('Failed to verify QR code token');
    }
  }
}

// Export singleton instance
module.exports = new QRService();
