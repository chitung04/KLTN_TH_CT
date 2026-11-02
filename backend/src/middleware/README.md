# Authentication Middleware

JWT-based authentication and authorization middleware for THCT Clinic backend API.

## Features

- **Token Verification**: Validates JWT tokens from Authorization Bearer headers
- **Role-Based Access Control**: Enforces role-based permissions (patient, doctor, receptionist, admin)
- **Optional Authentication**: Graceful degradation for mixed public/private endpoints
- **Security Headers**: Comprehensive security headers via Helmet
- **Convenience Middleware**: Pre-configured combinations for common use cases

## Quick Start

```javascript
const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Public route - no authentication required
app.get('/api/public', (req, res) => {
  res.json({ message: 'Public endpoint' });
});

// Protected route - requires valid JWT token
app.get('/api/protected', authMiddleware.verifyToken, (req, res) => {
  res.json({ 
    message: 'Protected endpoint',
    user: req.user // Contains: { id, userId, email, role, fullName, jti }
  });
});

// Admin only route
app.get('/api/admin', authMiddleware.adminOnly, (req, res) => {
  res.json({ message: 'Admin only endpoint' });
});

// Mixed authentication (shows different content based on auth status)
app.get('/api/mixed', authMiddleware.optionalAuth, (req, res) => {
  res.json({
    message: req.user ? 'Authenticated content' : 'Public content',
    isAuthenticated: !!req.user
  });
});
```

## Core Middleware Functions

### `verifyToken`

Validates JWT token and sets user context. Returns 401 for invalid/missing tokens.

```javascript
app.get('/api/profile', authMiddleware.verifyToken, (req, res) => {
  // req.user contains decoded JWT payload
  res.json({ user: req.user });
});
```

### `requireRole(roles)`

Factory function that creates role-checking middleware. Must be used after `verifyToken`.

```javascript
// Single role
app.get('/api/doctor-only', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole('doctor'),
  handler
);

// Multiple allowed roles
app.get('/api/medical-staff', 
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['doctor', 'admin']),
  handler
);
```

### `optionalAuth`

Attempts authentication but continues even if token is missing/invalid. Useful for endpoints that show different content based on authentication status.

```javascript
app.get('/api/appointments', authMiddleware.optionalAuth, (req, res) => {
  if (req.user) {
    // Show user's appointments
    res.json({ appointments: getUserAppointments(req.user.id) });
  } else {
    // Show public information
    res.json({ message: 'Please login to view appointments' });
  }
});
```

## Convenience Middleware Combinations

Pre-configured middleware arrays for common scenarios:

```javascript
// Role-specific access
app.get('/api/admin/*', authMiddleware.adminOnly, handler);
app.get('/api/patient/*', authMiddleware.patientOnly, handler);
app.get('/api/doctor/*', authMiddleware.doctorOnly, handler);
app.get('/api/receptionist/*', authMiddleware.receptionistOnly, handler);

// Multi-role access
app.get('/api/staff/*', authMiddleware.staffOnly, handler); // doctor, receptionist, admin
app.get('/api/medical/*', authMiddleware.medicalStaffOnly, handler); // doctor, admin
```

## User Context

After successful authentication, `req.user` contains:

```javascript
{
  id: 1,           // User ID (alias for userId)
  userId: 1,       // Primary user ID
  email: "user@example.com",
  role: "patient", // patient, doctor, receptionist, admin
  fullName: "John Doe",
  jti: "unique-token-id" // JWT ID for token blacklisting
}
```

## Error Responses

All authentication errors follow this format:

```javascript
{
  success: false,
  error: {
    code: "TOKEN_MISSING|TOKEN_INVALID|TOKEN_EXPIRED|INSUFFICIENT_PERMISSIONS",
    message: "Human-readable error message",
    timestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

### Common Error Codes

- `TOKEN_MISSING` (401): No Authorization header or malformed header
- `TOKEN_INVALID` (401): Invalid JWT signature or format
- `TOKEN_EXPIRED` (401): JWT token has expired
- `TOKEN_NOT_ACTIVE` (401): JWT token not yet valid (nbf claim)
- `INSUFFICIENT_PERMISSIONS` (403): User role doesn't match required role(s)

## Authorization Header Format

Tokens must be sent in the Authorization header with Bearer format:

```
Authorization: Bearer <jwt-token>
```

## Security Features

- **JWT Signature Verification**: All tokens are cryptographically verified
- **Role-Based Access Control**: Granular permissions based on user roles
- **Token Expiration**: Automatic token expiry handling (24h default)
- **Graceful Error Handling**: Consistent error responses
- **Security Headers**: Comprehensive protection via Helmet middleware

## Integration with Appointment System

The middleware seamlessly integrates with existing appointment endpoints:

```javascript
// Protected appointment creation - patient_id auto-populated from JWT
app.post('/api/appointments', authMiddleware.verifyToken, createAppointment);

// Doctor queue - filtered by authenticated doctor
app.get('/api/doctor-queue', authMiddleware.doctorOnly, getDoctorQueue);

// Check-in via QR - receptionist access only
app.post('/api/checkin', authMiddleware.receptionistOnly, checkinAppointment);
```

## Testing

The middleware includes comprehensive unit and integration tests:

```bash
# Run all middleware tests
npm test -- --testPathPatterns=authMiddleware

# Run specific test suite
npm test -- --testPathPatterns=authMiddleware.test.js
npm test -- --testPathPatterns=authMiddleware.integration.test.js
```

## Dependencies

- `jsonwebtoken` - JWT token operations
- `../services/jwtService` - JWT service for token generation/verification

## Related Components

- **JWT Service** (`../services/jwtService.js`) - Token generation and verification
- **Security Middleware** (`./securityMiddleware.js`) - Security headers
- **Password Service** (`../services/passwordService.js`) - Password hashing and validation