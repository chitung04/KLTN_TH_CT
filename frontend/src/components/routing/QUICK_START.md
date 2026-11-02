# ProtectedRoute - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Import the Component

```javascript
import ProtectedRoute from './components/routing/ProtectedRoute';
```

### Step 2: Wrap Your Protected Content

```jsx
<ProtectedRoute>
  <YourProtectedPage />
</ProtectedRoute>
```

**That's it!** Any authenticated user can now access this page.

---

## 🔐 Role-Based Protection (30 Seconds)

### Protect for Specific Role

```jsx
// Patient only
<ProtectedRoute requiredRole="patient">
  <BookingPage />
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

---

## 📋 Common Use Cases

### Use Case 1: Patient Booking Page

```jsx
// In App.js, when rendering booking page
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
```

### Use Case 2: Doctor Queue

```jsx
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
```

### Use Case 3: QR Check-in (Multiple Roles)

```jsx
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
```

### Use Case 4: Profile Page (Any Authenticated User)

```jsx
if (currentPage === 'profile') {
  return (
    <div className="app">
      <Navigation />
      <ProtectedRoute>
        <ProfileManager />
      </ProtectedRoute>
      <Footer />
    </div>
  );
}
```

---

## 🎨 Custom UI (Advanced)

### Custom Login Prompt

```jsx
const MyLoginPrompt = (
  <div className="my-custom-login">
    <h2>Please log in</h2>
    <button onClick={openLoginModal}>Login</button>
  </div>
);

<ProtectedRoute fallback={MyLoginPrompt}>
  <ProtectedContent />
</ProtectedRoute>
```

### Custom 403 Error

```jsx
const My403 = (
  <div className="my-custom-403">
    <h2>Access Denied</h2>
    <button onClick={() => window.history.back()}>Go Back</button>
  </div>
);

<ProtectedRoute 
  requiredRole="admin" 
  unauthorizedFallback={My403}
>
  <AdminContent />
</ProtectedRoute>
```

---

## 🔍 Check Resource Access

Use the helper function to conditionally show UI elements:

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
      
      {hasResourceAccess(user?.role, 'qr-checkin') && (
        <button>QR Check-in</button>
      )}
    </div>
  );
};
```

### Available Resources by Role

**Patient**:
- `booking`
- `medical-records-own`
- `appointments-own`
- `profile`

**Doctor**:
- `doctor-queue`
- `medical-records-assigned`
- `appointments-doctor`
- `profile`

**Receptionist**:
- `qr-checkin`
- `appointment-management`
- `check-in`
- `profile`

**Admin**:
- `all` (everything)

---

## 🐛 Troubleshooting

### Issue: "User is authenticated but sees login screen"

**Fix**: Check that `isAuthenticated` is true in AuthContext:

```javascript
const { user, isAuthenticated } = useAuth();
console.log('Is authenticated:', isAuthenticated);
```

### Issue: "403 error shown for correct role"

**Fix**: Check role spelling (lowercase):

```javascript
// ✅ Correct
<ProtectedRoute requiredRole="patient">

// ❌ Wrong
<ProtectedRoute requiredRole="Patient">
<ProtectedRoute requiredRole="PATIENT">
```

### Issue: "Loading spinner shows forever"

**Fix**: Ensure AuthContext sets `loading: false` after initialization:

```javascript
// In AuthContext
useEffect(() => {
  // ... auth check
  setLoading(false); // Don't forget this!
}, []);
```

---

## 📱 Mobile Responsive

The component is mobile-friendly by default. No extra configuration needed!

- Desktop: Full-width dialogs
- Tablet: Adjusted padding
- Mobile: Compact layout with touch-friendly buttons

---

## ♿ Accessibility

The component follows WCAG 2.1 AA standards:

- ✅ Keyboard navigation works
- ✅ Screen reader compatible
- ✅ High contrast mode supported
- ✅ Reduced motion respected

---

## 📚 Need More Help?

- **Full Documentation**: See [README.md](./README.md)
- **Examples**: See [ProtectedRoute.example.jsx](./ProtectedRoute.example.jsx)
- **Tests**: See [__tests__/ProtectedRoute.test.js](./__tests__/ProtectedRoute.test.js)
- **Implementation Details**: See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## 🎯 Cheat Sheet

```jsx
// Any authenticated user
<ProtectedRoute>
  <Content />
</ProtectedRoute>

// Single role
<ProtectedRoute requiredRole="patient">
  <Content />
</ProtectedRoute>

// Multiple roles
<ProtectedRoute requiredRole={['doctor', 'admin']}>
  <Content />
</ProtectedRoute>

// Custom fallback
<ProtectedRoute fallback={<CustomLogin />}>
  <Content />
</ProtectedRoute>

// With callbacks
<ProtectedRoute 
  onAuthRequired={() => console.log('Login needed')}
  onUnauthorized={(role, required) => console.log('Access denied')}
>
  <Content />
</ProtectedRoute>

// Resource check
if (hasResourceAccess(user?.role, 'booking')) {
  // Show booking feature
}
```

---

**Happy Coding! 🎉**

Questions? Check the full [README.md](./README.md) or [examples](./ProtectedRoute.example.jsx).
