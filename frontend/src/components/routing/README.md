# ProtectedRoute Component

## Overview

The `ProtectedRoute` component is a comprehensive authentication and authorization wrapper for React components in the THCT Clinic application. It provides role-based access control (RBAC) with support for patient, doctor, receptionist, and admin roles.

## Features

- ✅ **Authentication Checking**: Ensures users are logged in before accessing protected content
- ✅ **Role-Based Access Control**: Supports single or multiple role requirements
- ✅ **Loading States**: Displays spinner while authentication is being verified
- ✅ **Custom Fallbacks**: Allows custom UI for unauthenticated/unauthorized states
- ✅ **Return URL Preservation**: Saves current page for post-login redirect
- ✅ **403 Forbidden Display**: Shows appropriate error for unauthorized access
- ✅ **Event Callbacks**: Provides hooks for authentication and authorization events
- ✅ **Responsive Design**: Mobile-friendly UI for all states
- ✅ **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation

## Requirements Validation

This component validates the following requirements from the User Authentication System spec:

- **Requirement 3.1**: Patient role can access booking and their own medical records
- **Requirement 3.2**: Doctor role can access doctor queue and assigned patient records
- **Requirement 3.3**: Receptionist role can access check-in QR and appointment management
- **Requirement 3.4**: Admin role can access all system management functions
- **Requirement 3.6**: Returns 403 Forbidden when user accesses unauthorized function

## Installation

The component is already integrated into the THCT Clinic frontend. No additional installation required.

```javascript
import ProtectedRoute from './components/routing/ProtectedRoute';
```

## Basic Usage

### Any Authenticated User

```jsx
<ProtectedRoute>
  <MyProtectedPage />
</ProtectedRoute>
```

### Single Role Requirement

```jsx
// Patient only
<ProtectedRoute requiredRole="patient">
  <PatientDashboard />
</ProtectedRoute>

// Doctor only
<ProtectedRoute requiredRole="doctor">
  <DoctorQueue />
</ProtectedRoute>

// Receptionist only
<ProtectedRoute requiredRole="receptionist">
  <QRCheckin />
</ProtectedRoute>

// Admin only
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

### Multiple Roles (OR Logic)

```jsx
<ProtectedRoute requiredRole={['doctor', 'receptionist', 'admin']}>
  <MedicalStaffPortal />
</ProtectedRoute>
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | Required | Content to render when authorized |
| `requiredRole` | `string \| string[] \| null` | `null` | Required role(s). `null` = any authenticated user |
| `fallback` | `React.ReactNode` | `null` | Custom component for unauthenticated users |
| `unauthorizedFallback` | `React.ReactNode` | `null` | Custom component for unauthorized users |
| `onAuthRequired` | `Function` | `null` | Callback when authentication is required |
| `onUnauthorized` | `Function` | `null` | Callback when user lacks required role |
| `preserveReturnUrl` | `boolean` | `true` | Save current URL for post-login redirect |

## Advanced Usage

### Custom Unauthenticated Fallback

```jsx
const CustomLogin = () => (
  <div className="custom-login">
    <h2>Please log in to continue</h2>
    <button onClick={() => openLoginModal()}>Login</button>
  </div>
);

<ProtectedRoute fallback={<CustomLogin />}>
  <ProtectedContent />
</ProtectedRoute>
```

### Custom Unauthorized Fallback (403)

```jsx
const Custom403 = () => (
  <div className="custom-403">
    <h2>Access Denied</h2>
    <p>You need admin privileges</p>
  </div>
);

<ProtectedRoute 
  requiredRole="admin" 
  unauthorizedFallback={<Custom403 />}
>
  <AdminContent />
</ProtectedRoute>
```

### Event Callbacks

```jsx
<ProtectedRoute
  requiredRole="doctor"
  onAuthRequired={() => {
    console.log('User needs to log in');
    analytics.track('auth_required');
  }}
  onUnauthorized={(userRole, requiredRole) => {
    console.log(`User ${userRole} tried to access ${requiredRole}`);
    analytics.track('unauthorized_access', { userRole, requiredRole });
  }}
>
  <DoctorContent />
</ProtectedRoute>
```

## Resource Access Helper

The component exports a `hasResourceAccess` helper function for conditional rendering:

```javascript
import { hasResourceAccess } from './components/routing/ProtectedRoute';

const MyComponent = () => {
  const { user } = useAuth();

  return (
    <div>
      {hasResourceAccess(user?.role, 'booking') && (
        <button>Book Appointment</button>
      )}
      {hasResourceAccess(user?.role, 'doctor-queue') && (
        <button>View Queue</button>
      )}
    </div>
  );
};
```

### Available Resources

#### Patient Resources
- `booking` - Book appointments
- `medical-records-own` - View own medical records
- `appointments-own` - View own appointments
- `profile` - Edit profile

#### Doctor Resources
- `doctor-queue` - View doctor queue
- `medical-records-assigned` - View assigned patient records
- `appointments-doctor` - View doctor appointments
- `profile` - Edit profile

#### Receptionist Resources
- `qr-checkin` - QR code check-in
- `appointment-management` - Manage appointments
- `check-in` - Check-in patients
- `profile` - Edit profile

#### Admin Resources
- `all` - Access to everything (any resource name returns true)

## Role Permissions Constant

The component exports `ROLE_PERMISSIONS` constant for reference:

```javascript
import { ROLE_PERMISSIONS } from './components/routing/ProtectedRoute';

console.log(ROLE_PERMISSIONS);
// {
//   patient: ['booking', 'medical-records-own', 'profile', 'appointments-own'],
//   doctor: ['doctor-queue', 'medical-records-assigned', 'profile', 'appointments-doctor'],
//   receptionist: ['qr-checkin', 'appointment-management', 'profile', 'check-in'],
//   admin: ['all']
// }
```

## Integration with THCT Clinic App

The THCT Clinic app uses page-based navigation (not React Router). Here's how to integrate:

```jsx
function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { user } = useAuth();

  // Render different pages based on route
  if (currentPage === 'booking') {
    return (
      <div className="app">
        <Navigation />
        <ProtectedRoute requiredRole="patient">
          <BookingPage />
        </ProtectedRoute>
        <Footer />
      </div>
    );
  }

  if (currentPage === 'doctor-queue') {
    return (
      <div className="app">
        <Navigation />
        <ProtectedRoute requiredRole="doctor">
          <DoctorQueue />
        </ProtectedRoute>
        <Footer />
      </div>
    );
  }

  if (currentPage === 'qr-checkin') {
    return (
      <div className="app">
        <Navigation />
        <ProtectedRoute requiredRole={['receptionist', 'admin']}>
          <QRCheckin />
        </ProtectedRoute>
        <Footer />
      </div>
    );
  }

  // ... other pages
}
```

## Styling

The component uses `ProtectedRoute.css` for styling. You can override styles by:

1. **Modifying the CSS file** (not recommended):
   ```css
   /* frontend/src/components/routing/ProtectedRoute.css */
   .protected-route-loading {
     /* Your custom styles */
   }
   ```

2. **Using custom fallbacks** (recommended):
   ```jsx
   <ProtectedRoute fallback={<YourCustomComponent />}>
     <Content />
   </ProtectedRoute>
   ```

## Testing

The component includes comprehensive unit tests. Run tests with:

```bash
cd frontend
npm test -- ProtectedRoute.test.js --watchAll=false
```

### Test Coverage

- ✅ Loading states
- ✅ Unauthenticated states
- ✅ Role-based access control (all 4 roles)
- ✅ Multiple role requirements
- ✅ Custom fallbacks
- ✅ Event callbacks
- ✅ Return URL preservation
- ✅ Resource access helpers
- ✅ Edge cases and error handling

**Test Results**: 31/31 tests passing ✅

## Examples

See `ProtectedRoute.example.jsx` for 14+ detailed usage examples including:

1. Basic protected route
2. Single role protection (all 4 roles)
3. Multiple roles (OR logic)
4. Custom fallbacks
5. Event callbacks
6. Resource access helpers
7. Nested protected routes
8. Conditional rendering by role
9. Page-based navigation integration

## Accessibility

The component follows WCAG 2.1 AA standards:

- ✅ Semantic HTML structure
- ✅ Proper heading hierarchy
- ✅ Color contrast ratios meet 4.5:1 minimum
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Reduced motion support (`prefers-reduced-motion`)
- ✅ High contrast mode support (`prefers-contrast`)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### User is authenticated but sees login screen

**Cause**: `isAuthenticated` is false or `user` is null in AuthContext

**Solution**: Check that AuthContext properly sets user state after login

### 403 error shown for correct role

**Cause**: Role mismatch or case sensitivity issue

**Solution**: Ensure role is exactly `'patient'`, `'doctor'`, `'receptionist'`, or `'admin'` (lowercase)

### Loading spinner shows indefinitely

**Cause**: AuthContext `loading` state never resolves

**Solution**: Check AuthContext initialization and ensure it sets `loading: false`

### Return URL not preserved

**Cause**: `preserveReturnUrl` is false or sessionStorage is disabled

**Solution**: Set `preserveReturnUrl={true}` and ensure sessionStorage is available

## Related Components

- `AuthContext` - Provides authentication state
- `AuthModal` - Login/register modal
- `ProfileManager` - User profile management
- `AuthErrorBoundary` - Error boundary for auth failures

## Contributing

When modifying this component:

1. Update unit tests in `__tests__/ProtectedRoute.test.js`
2. Update this README with any API changes
3. Update examples in `ProtectedRoute.example.jsx`
4. Ensure all tests pass: `npm test -- ProtectedRoute.test.js --watchAll=false`
5. Test on mobile devices and different screen sizes

## License

Part of THCT Clinic System - Graduation Thesis 2026

## Support

For questions or issues, contact the development team or refer to the main project documentation.
