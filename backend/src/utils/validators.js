const validator = require('validator');

/**
 * Input validators and sanitizers for the authentication system
 * Implements Requirements 1.5, 1.6, 5.4, 9.2
 * - Email validation using RFC 5322 standards
 * - Password strength validation (8+ chars, mixed case, numbers)
 * - Vietnamese phone number validation
 * - Input sanitization to prevent XSS attacks
 */

class Validators {
    /**
     * Validate email format using RFC 5322 standards
     * @param {String} email - Email address to validate
     * @returns {Object} - { isValid: boolean, error: string|null }
     * 
     * Validates Requirements:
     * - 1.5: Email_Validator SHALL kiểm tra định dạng email hợp lệ theo chuẩn RFC 5322
     * - 9.2: Email validation for profile updates
     */
    static validateEmail(email) {
        try {
            // Check if email is provided
            if (!email || typeof email !== 'string') {
                return {
                    isValid: false,
                    error: 'Email is required'
                };
            }

            // Trim whitespace
            const trimmedEmail = email.trim();

            // Check length constraints
            if (trimmedEmail.length === 0) {
                return {
                    isValid: false,
                    error: 'Email cannot be empty'
                };
            }

            if (trimmedEmail.length > 100) {
                return {
                    isValid: false,
                    error: 'Email must not exceed 100 characters'
                };
            }

            // Validate email format using validator.js (RFC 5322 compliant)
            if (!validator.isEmail(trimmedEmail)) {
                return {
                    isValid: false,
                    error: 'Invalid email format'
                };
            }

            // Additional checks for common issues
            const emailParts = trimmedEmail.split('@');
            if (emailParts.length !== 2) {
                return {
                    isValid: false,
                    error: 'Invalid email format'
                };
            }

            const [localPart, domainPart] = emailParts;

            // Check local part length (before @)
            if (localPart.length === 0 || localPart.length > 64) {
                return {
                    isValid: false,
                    error: 'Email local part must be between 1 and 64 characters'
                };
            }

            // Check domain part length (after @)
            if (domainPart.length === 0 || domainPart.length > 253) {
                return {
                    isValid: false,
                    error: 'Email domain part must be between 1 and 253 characters'
                };
            }

            // Validate domain format more strictly
            if (!validator.isFQDN(domainPart)) {
                return {
                    isValid: false,
                    error: 'Invalid domain format'
                };
            }

            return {
                isValid: true,
                error: null
            };

        } catch (error) {
            return {
                isValid: false,
                error: 'Email validation failed'
            };
        }
    }

    /**
     * Validate password strength according to requirements
     * @param {String} password - Password to validate
     * @returns {Object} - { isValid: boolean, errors: string[], requirements: object }
     * 
     * Validates Requirements:
     * - 1.6: Password_Validator SHALL yêu cầu mật khẩu tối thiểu 8 ký tự bao gồm chữ hoa, chữ thường và số
     * - 5.4: Password_Validator SHALL từ chối mật khẩu yếu
     */
    static validatePassword(password) {
        const errors = [];
        const requirements = {
            minLength: false,
            hasUppercase: false,
            hasLowercase: false,
            hasNumbers: false,
            maxLength: false
        };

        try {
            // Check if password is provided
            if (!password || typeof password !== 'string') {
                errors.push('Password is required');
                return { isValid: false, errors, requirements };
            }

            // Check minimum length (8 characters)
            if (password.length >= 8) {
                requirements.minLength = true;
            } else {
                errors.push('Password must be at least 8 characters long');
            }

            // Check maximum length for security (prevent DoS attacks)
            if (password.length <= 128) {
                requirements.maxLength = true;
            } else {
                errors.push('Password must not exceed 128 characters');
            }

            // Check for uppercase letter (A-Z)
            if (/[A-Z]/.test(password)) {
                requirements.hasUppercase = true;
            } else {
                errors.push('Password must contain at least one uppercase letter (A-Z)');
            }

            // Check for lowercase letter (a-z)
            if (/[a-z]/.test(password)) {
                requirements.hasLowercase = true;
            } else {
                errors.push('Password must contain at least one lowercase letter (a-z)');
            }

            // Check for number (0-9)
            if (/\d/.test(password)) {
                requirements.hasNumbers = true;
            } else {
                errors.push('Password must contain at least one number (0-9)');
            }

            // Additional security checks
            // Check for common weak patterns
            const weakPatterns = [
                /^(.)\1{7,}$/, // All same character repeated
                /^(012|123|234|345|456|567|678|789|890)+/, // Sequential numbers
                /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, // Sequential letters
                /^(qwerty|asdfgh|zxcvbn|password|admin|user|test)+/i // Common weak passwords
            ];

            for (const pattern of weakPatterns) {
                if (pattern.test(password)) {
                    errors.push('Password contains weak patterns and should be more complex');
                    break;
                }
            }

            const isValid = errors.length === 0;

            return {
                isValid,
                errors,
                requirements
            };

        } catch (error) {
            return {
                isValid: false,
                errors: ['Password validation failed'],
                requirements
            };
        }
    }

    /**
     * Validate Vietnamese phone number format
     * @param {String} phone - Phone number to validate
     * @returns {Object} - { isValid: boolean, error: string|null, formatted: string|null }
     * 
     * Validates Requirements:
     * - Phone number validation for Vietnamese format
     * - 9.2: Phone validation for profile updates
     */
    static validateVietnamesePhone(phone) {
        try {
            // Check if phone is provided
            if (!phone || typeof phone !== 'string') {
                return {
                    isValid: false,
                    error: 'Phone number is required',
                    formatted: null
                };
            }

            // Remove all spaces, dashes, and other non-numeric characters except + and ()
            let cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

            // Handle international format (+84)
            if (cleanPhone.startsWith('+84')) {
                cleanPhone = '84' + cleanPhone.substring(3);
            } else if (cleanPhone.startsWith('0084')) {
                cleanPhone = '84' + cleanPhone.substring(4);
            }

            // Check length constraints
            if (cleanPhone.length < 10 || cleanPhone.length > 12) {
                return {
                    isValid: false,
                    error: 'Phone number must be between 10 and 12 digits',
                    formatted: null
                };
            }

            // Check if contains only digits
            if (!/^\d+$/.test(cleanPhone)) {
                return {
                    isValid: false,
                    error: 'Phone number must contain only digits',
                    formatted: null
                };
            }

            // Vietnamese phone number patterns
            const vietnamesePatterns = [
                // Mobile networks
                /^(84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])\d{7}$/, // Viettel, Mobifone, Vinaphone, etc.
                // Landline numbers
                /^(84|0)(2[0-9])\d{8}$/, // Hanoi, Ho Chi Minh City and other provinces
                /^(84|0)(1[0-9])\d{8}$/ // Legacy landline format
            ];

            let isValid = false;
            for (const pattern of vietnamesePatterns) {
                if (pattern.test(cleanPhone)) {
                    isValid = true;
                    break;
                }
            }

            if (!isValid) {
                return {
                    isValid: false,
                    error: 'Invalid Vietnamese phone number format',
                    formatted: null
                };
            }

            // Format the phone number for storage (normalize to 84 format)
            let formatted;
            if (cleanPhone.startsWith('84')) {
                formatted = cleanPhone;
            } else if (cleanPhone.startsWith('0')) {
                formatted = '84' + cleanPhone.substring(1);
            } else {
                formatted = '84' + cleanPhone;
            }

            return {
                isValid: true,
                error: null,
                formatted: formatted
            };

        } catch (error) {
            return {
                isValid: false,
                error: 'Phone number validation failed',
                formatted: null
            };
        }
    }

    /**
     * Sanitize input to prevent XSS attacks
     * @param {String} input - Input string to sanitize
     * @returns {String} - Sanitized string safe for storage and display
     * 
     * Validates Requirements:
     * - XSS attack prevention through input sanitization
     * - 9.2: Input sanitization for profile updates
     */
    static sanitizeInput(input) {
        try {
            if (!input || typeof input !== 'string') {
                return '';
            }

            // Trim whitespace
            let sanitized = validator.trim(input);

            // Escape HTML entities to prevent XSS
            sanitized = validator.escape(sanitized);

            // Additional XSS protection - remove potentially dangerous patterns
            // Remove script tags and their content
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            
            // Remove on* event handlers
            sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
            
            // Remove javascript: URLs
            sanitized = sanitized.replace(/javascript:/gi, '');
            
            // Remove data: URLs (can be used for XSS)
            sanitized = sanitized.replace(/data:/gi, '');
            
            // Remove vbscript: URLs
            sanitized = sanitized.replace(/vbscript:/gi, '');

            // Normalize whitespace
            sanitized = sanitized.replace(/\s+/g, ' ').trim();

            return sanitized;

        } catch (error) {
            // If sanitization fails, return empty string for safety
            return '';
        }
    }

    /**
     * Validate and sanitize user name (full name)
     * @param {String} name - Name to validate and sanitize
     * @returns {Object} - { isValid: boolean, error: string|null, sanitized: string }
     */
    static validateAndSanitizeName(name) {
        try {
            if (!name || typeof name !== 'string') {
                return {
                    isValid: false,
                    error: 'Name is required',
                    sanitized: ''
                };
            }

            const sanitized = this.sanitizeInput(name);

            // Check length after sanitization
            if (sanitized.length === 0) {
                return {
                    isValid: false,
                    error: 'Name cannot be empty',
                    sanitized: ''
                };
            }

            if (sanitized.length < 2) {
                return {
                    isValid: false,
                    error: 'Name must be at least 2 characters long',
                    sanitized
                };
            }

            if (sanitized.length > 100) {
                return {
                    isValid: false,
                    error: 'Name must not exceed 100 characters',
                    sanitized
                };
            }

            // Check for valid name patterns (letters, spaces, common Vietnamese characters)
            const namePattern = /^[a-zA-ZÀ-ỹ\s]+$/;
            if (!namePattern.test(sanitized)) {
                return {
                    isValid: false,
                    error: 'Name can only contain letters and spaces',
                    sanitized
                };
            }

            return {
                isValid: true,
                error: null,
                sanitized
            };

        } catch (error) {
            return {
                isValid: false,
                error: 'Name validation failed',
                sanitized: ''
            };
        }
    }

    /**
     * Validate date of birth
     * @param {String} dateOfBirth - Date in YYYY-MM-DD format
     * @returns {Object} - { isValid: boolean, error: string|null, date: Date|null }
     */
    static validateDateOfBirth(dateOfBirth) {
        try {
            if (!dateOfBirth || typeof dateOfBirth !== 'string') {
                return {
                    isValid: false,
                    error: 'Date of birth is required',
                    date: null
                };
            }

            // Check date format (YYYY-MM-DD)
            if (!validator.isDate(dateOfBirth, { format: 'YYYY-MM-DD' })) {
                return {
                    isValid: false,
                    error: 'Invalid date format. Use YYYY-MM-DD',
                    date: null
                };
            }

            const date = new Date(dateOfBirth);
            const currentDate = new Date();
            
            // Check if date is in the future
            if (date > currentDate) {
                return {
                    isValid: false,
                    error: 'Date of birth cannot be in the future',
                    date: null
                };
            }

            // Check minimum age (13 years old for account creation)
            const minAge = 13;
            const minAgeDate = new Date();
            minAgeDate.setFullYear(currentDate.getFullYear() - minAge);
            
            if (date > minAgeDate) {
                return {
                    isValid: false,
                    error: `Must be at least ${minAge} years old`,
                    date: null
                };
            }

            // Check maximum age (120 years)
            const maxAge = 120;
            const maxAgeDate = new Date();
            maxAgeDate.setFullYear(currentDate.getFullYear() - maxAge);
            
            if (date < maxAgeDate) {
                return {
                    isValid: false,
                    error: `Age cannot exceed ${maxAge} years`,
                    date: null
                };
            }

            return {
                isValid: true,
                error: null,
                date: date
            };

        } catch (error) {
            return {
                isValid: false,
                error: 'Date validation failed',
                date: null
            };
        }
    }

    /**
     * Validate user role
     * @param {String} role - User role to validate
     * @returns {Object} - { isValid: boolean, error: string|null }
     */
    static validateUserRole(role) {
        const validRoles = ['patient', 'doctor', 'receptionist', 'admin'];
        
        if (!role || typeof role !== 'string') {
            return {
                isValid: false,
                error: 'Role is required'
            };
        }

        if (!validRoles.includes(role.toLowerCase())) {
            return {
                isValid: false,
                error: `Role must be one of: ${validRoles.join(', ')}`
            };
        }

        return {
            isValid: true,
            error: null
        };
    }

    /**
     * Comprehensive validation for user registration data
     * @param {Object} userData - User registration data
     * @returns {Object} - { isValid: boolean, errors: object, sanitizedData: object }
     */
    static validateRegistrationData(userData) {
        const errors = {};
        const sanitizedData = {};

        try {
            // Validate and sanitize full name
            const nameValidation = this.validateAndSanitizeName(userData.fullName);
            if (!nameValidation.isValid) {
                errors.fullName = nameValidation.error;
            } else {
                sanitizedData.fullName = nameValidation.sanitized;
            }

            // Validate email
            const emailValidation = this.validateEmail(userData.email);
            if (!emailValidation.isValid) {
                errors.email = emailValidation.error;
            } else {
                sanitizedData.email = userData.email.trim().toLowerCase();
            }

            // Validate phone
            const phoneValidation = this.validateVietnamesePhone(userData.phone);
            if (!phoneValidation.isValid) {
                errors.phone = phoneValidation.error;
            } else {
                sanitizedData.phone = phoneValidation.formatted;
            }

            // Validate password
            const passwordValidation = this.validatePassword(userData.password);
            if (!passwordValidation.isValid) {
                errors.password = passwordValidation.errors;
            } else {
                sanitizedData.password = userData.password; // Don't sanitize password, just validate
            }

            // Validate date of birth
            if (userData.dateOfBirth) {
                const dobValidation = this.validateDateOfBirth(userData.dateOfBirth);
                if (!dobValidation.isValid) {
                    errors.dateOfBirth = dobValidation.error;
                } else {
                    sanitizedData.dateOfBirth = userData.dateOfBirth;
                }
            }

            // Validate role (optional, defaults to 'patient')
            const role = userData.role || 'patient';
            const roleValidation = this.validateUserRole(role);
            if (!roleValidation.isValid) {
                errors.role = roleValidation.error;
            } else {
                sanitizedData.role = role.toLowerCase();
            }

            return {
                isValid: Object.keys(errors).length === 0,
                errors,
                sanitizedData
            };

        } catch (error) {
            return {
                isValid: false,
                errors: { general: 'Validation failed' },
                sanitizedData: {}
            };
        }
    }

    /**
     * Validate login credentials
     * @param {Object} credentials - { email, password }
     * @returns {Object} - { isValid: boolean, errors: object }
     */
    static validateLoginCredentials(credentials) {
        const errors = {};

        try {
            // Validate email
            const emailValidation = this.validateEmail(credentials.email);
            if (!emailValidation.isValid) {
                errors.email = emailValidation.error;
            }

            // Check password presence (don't validate strength for login)
            if (!credentials.password || typeof credentials.password !== 'string') {
                errors.password = 'Password is required';
            } else if (credentials.password.trim().length === 0) {
                errors.password = 'Password cannot be empty';
            }

            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };

        } catch (error) {
            return {
                isValid: false,
                errors: { general: 'Credential validation failed' }
            };
        }
    }
}

module.exports = Validators;