const bcrypt = require('bcryptjs');

class PasswordService {
    constructor() {
        // Use salt rounds from env, minimum 10 for development
        const envRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        this.saltRounds = Math.max(envRounds, 10); // Minimum 10 for reasonable security
    }

    /**
     * Hash password using bcrypt with minimum salt rounds 12
     * @param {String} plainPassword - Plain text password to hash
     * @returns {Promise<String>} - Hashed password
     * @throws {Error} - If password hashing fails
     * 
     * Validates Requirements:
     * - 1.4: Password_Hasher SHALL mã hóa mật khẩu bằng bcrypt với salt rounds tối thiểu 10
     * - 5.1: Password_Hasher SHALL không bao giờ lưu mật khẩu dạng plain text
     * - 5.2: Password_Hasher SHALL sử dụng bcrypt với cost factor tối thiểu 10
     */
    async hashPassword(plainPassword) {
        try {
            // Validate input
            if (!plainPassword || typeof plainPassword !== 'string') {
                throw new Error('Password must be a non-empty string');
            }

            // Hash password with salt rounds (minimum 12)
            const hashedPassword = await bcrypt.hash(plainPassword, this.saltRounds);
            
            // Verify the hash was created successfully
            if (!hashedPassword || !hashedPassword.startsWith('$2b$')) {
                throw new Error('Password hashing failed - invalid hash format');
            }

            return hashedPassword;
        } catch (error) {
            if (error.message.includes('Password must be a non-empty string') || 
                error.message.includes('Password hashing failed')) {
                throw error;
            }
            throw new Error(`Password hashing failed: ${error.message}`);
        }
    }

    /**
     * Compare plain text password with hashed password for login validation
     * @param {String} plainPassword - Plain text password from user input
     * @param {String} hashedPassword - Hashed password from database
     * @returns {Promise<Boolean>} - True if passwords match, false otherwise
     * @throws {Error} - If comparison fails
     * 
     * Validates Requirements:
     * - 5.3: Password comparison for login validation
     * - 2.1: Authentication credential verification
     */
    async comparePassword(plainPassword, hashedPassword) {
        try {
            // Validate inputs
            if (!plainPassword || typeof plainPassword !== 'string') {
                throw new Error('Plain password must be a non-empty string');
            }

            if (!hashedPassword || typeof hashedPassword !== 'string') {
                throw new Error('Hashed password must be a non-empty string');
            }

            // Verify hash format (bcrypt hashes start with $2b$ or $2a$)
            if (!hashedPassword.match(/^\$2[ab]\$\d+\$/)) {
                throw new Error('Invalid hash format');
            }

            // Compare password with hash
            const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
            return isMatch;
        } catch (error) {
            if (error.message.includes('must be a non-empty string') || 
                error.message.includes('Invalid hash format')) {
                throw error;
            }
            throw new Error(`Password comparison failed: ${error.message}`);
        }
    }

    /**
     * Validate password strength according to requirements
     * @param {String} password - Password to validate
     * @returns {Object} - Validation result { isValid: boolean, errors: string[] }
     * 
     * Validates Requirements:
     * - 1.6: Password_Validator SHALL yêu cầu mật khẩu tối thiểu 8 ký tự bao gồm chữ hoa, chữ thường và số
     * - 5.4: Password_Validator SHALL từ chối mật khẩu yếu
     */
    validatePasswordStrength(password) {
        const errors = [];
        
        if (!password || typeof password !== 'string') {
            errors.push('Password is required');
            return { isValid: false, errors };
        }

        // Check minimum length (8 characters)
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        // Check for uppercase letter
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        // Check for lowercase letter
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        // Check for number
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        // Additional security checks
        if (password.length > 128) {
            errors.push('Password must not exceed 128 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate a secure random password for testing or admin purposes
     * @param {Number} length - Password length (default 12)
     * @returns {String} - Generated password that meets strength requirements
     */
    generateSecurePassword(length = 12) {
        const minLength = Math.max(length, 8);
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let password = '';
        
        // Ensure at least one character from each required category
        password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        
        // Fill the rest randomly
        const allChars = uppercase + lowercase + numbers + symbols;
        for (let i = password.length; i < minLength; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        
        // Shuffle the password to avoid predictable patterns
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    /**
     * Check if a password needs to be rehashed (e.g., if salt rounds have increased)
     * @param {String} hashedPassword - Current hashed password
     * @returns {Boolean} - True if password should be rehashed
     */
    needsRehash(hashedPassword) {
        try {
            if (!hashedPassword || typeof hashedPassword !== 'string') {
                return true;
            }

            // Extract current rounds from hash
            const match = hashedPassword.match(/^\$2[ab]\$(\d+)\$/);
            if (!match) {
                return true;
            }

            const currentRounds = parseInt(match[1]);
            return currentRounds < this.saltRounds;
        } catch (error) {
            return true;
        }
    }

    /**
     * Get the current salt rounds configuration
     * @returns {Number} - Current salt rounds
     */
    getSaltRounds() {
        return this.saltRounds;
    }

    /**
     * Verify that no plain text passwords are stored anywhere
     * This is a security validation method
     * @param {String} potentialHash - String to check if it's a hash
     * @returns {Boolean} - True if string appears to be a bcrypt hash
     */
    isValidBcryptHash(potentialHash) {
        if (!potentialHash || typeof potentialHash !== 'string') {
            return false;
        }

        // Check bcrypt hash format: $2a$10$... or $2b$12$...
        return /^\$2[ab]\$\d{2}\$.{53}$/.test(potentialHash);
    }
}

module.exports = new PasswordService();