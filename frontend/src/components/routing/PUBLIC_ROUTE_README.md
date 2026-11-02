# PublicRoute Component

## Overview

`PublicRoute` is a route wrapper component designed for public pages (login, register, marketing pages) in the THCT Clinic application. It provides intelligent redirect behavior for authenticated users trying to access login/register pages, while allowing unrestricted access to public marketing content.

## Features

- **Smart Redirect**: Automatically redirects authenticated users away from login/register pages
- **Public Access**: Allows unauthenticated users to access public pages
- **Deep Linking**: Preserves return URLs for post-login redirect to protected content
- **Loading States**: Shows loading indicators while checking authentication status
- **Flexible Configuration**: Supports both restricted (login/register) and unrestricted (marketing) public pages

## Requirements Validation

### Requirement 2.6: Redirect Authenticated Users
✅ Authenticated users are automatically redirected away from login/register pages to prevent unnecessary re-authentication.

## Usage

### Basic Usage - Unrestricted Public Page

```jsx
import { PublicRoute } from './components/routing';

function MarketingPage() {
  return (
    <PublicRoute>
      <div>
        <h1>Welcome to THCT Clinic</h1>
        <p>Our services include...</p>
      </div>
    </PublicRoute>
  );
}
```

**Behavior**: Both authenticated and unauthenticated users can access this page.

### Restricted Public Page (Login/Register)

```jsx
import { PublicRoute } from './components/routing';

function LoginPage() {
  const navigate = (page) => {
    // Your navigation logic
    setCurrentPage(page);
  };

  return (
    <PublicRoute 
      restricted={true}
      onRedirect={navigate}
    >
      <LoginForm />
    </PublicRoute>
  );
}
```

**Behavior**: 
- Unauthenticated users see the login form
- Authenticated users are redirected to dashboard

### Custom Redirect Location

```jsx
<PublicRoute 
  restricted={true}
  redirectTo="profile"
  onRedirect={(page) => setCurrentPage(page)}
>
  <LoginForm />
</PublicRoute>
```

**Behavior**: Redirects authenticated users to the profile page instead of dashboard.

### Deep Linking with Return URLs

```jsx
// When user tries to access /booking without authentication:
// 1. System stores '/booking' in sessionStorage as returnUrl
// 2. User is redirected to login
// 3. After successful login, PublicRoute checks for returnUrl
// 4. User is redirected to /booking instead of default dashboard

<PublicRoute 
  restricted={true}
  onRedirect={(page) => {
    // page will be 'booking' if returnUrl was '/booking'
    setCurrentPage(page);
  }}
>
  <LoginForm />
</PublicRoute>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | required | Content to render for public access |
| `restricted` | `boolean` | `false` | If true, authenticated users are redirected away |
| `redirectTo` | `string` | `'dashboard'` | Default page to redirect authenticated users to |
| `onRedirect` | `function` | `null` | Callback when redirect occurs, receives page name |

### onRedirect Callback

```jsx
onRedirect: (pageName: string) => void
```

Called when an authenticated user attempts to access a restricted page. The `pageName` is either:
- The page extracted from `returnUrl` in sessionStorage (if available)
- The value of `redirectTo` prop (if no returnUrl)

## Integration with App.js (Page-Based Navigation)

Since THCT Clinic uses page-based navigation (not React Router), PublicRoute integrates with the `currentPage` state:

```jsx
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Standalone login page example (if needed)
  if (currentPage === 'login') {
    return (
      <PublicRoute 
        restricted={true}
        onRedirect={setCurrentPage}
      >
        <LoginForm onSuccess={() => setCurrentPage('dashboard')} />
      </PublicRoute>
    );
  }

  // Marketing/info page example
  if (currentPage === 'about') {
    return (
      <PublicRoute>
        <AboutPage />
      </PublicRoute>
    );
  }

  // ... other pages
}
```

**Note**: Currently, THCT Clinic uses modal-based login/register (AuthModal), so PublicRoute is primarily useful for:
- Future standalone login/register pages
- Public marketing/info pages that should be accessible to all users
- Landing pages with conditional content based on authentication

## CSS Styling

PublicRoute shares CSS classes with ProtectedRoute for consistency:

```css
/* Loading state */
.protected-route-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* Redirect message (unique to PublicRoute) */
.public-route-redirect {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}
```

Custom styles can be added to `ProtectedRoute.css` since both components share the same stylesheet.

## Return URL Workflow

1. **User attempts to access protected resource** (e.g., /booking)
2. **ProtectedRoute stores current URL** in sessionStorage as `returnUrl`
3. **User is redirected to login**
4. **User completes authentication**
5. **PublicRoute checks sessionStorage** for returnUrl
6. **If returnUrl exists**: Redirect to stored URL
7. **If no returnUrl**: Redirect to default (dashboard)
8. **SessionStorage is cleared** after redirect

Example:
```
User clicks "Book Appointment" → 
ProtectedRoute stores '/booking' → 
Shows login modal → 
User logs in → 
PublicRoute redirects to '/booking' → 
User sees booking page
```

## Comparison with ProtectedRoute

| Feature | ProtectedRoute | PublicRoute |
|---------|---------------|-------------|
| Purpose | Protect authenticated content | Public pages with smart redirects |
| Unauthenticated Users | Show login prompt / redirect | Allow access |
| Authenticated Users | Allow access (if role matches) | Redirect away (if restricted) |
| Role Checking | Yes (RBAC support) | No (all authenticated users treated same) |
| Use Cases | Dashboard, profile, appointments | Login, register, marketing pages |

## Testing

PublicRoute includes comprehensive unit tests covering:

- ✅ Public access for unauthenticated users
- ✅ Redirect behavior for authenticated users on restricted pages
- ✅ Return URL handling and deep linking
- ✅ Loading states during authentication checks
- ✅ Custom redirect locations
- ✅ Edge cases and error handling

Run tests:
```bash
npm test -- PublicRoute.test.js
```

## Best Practices

### ✅ DO

- Use `restricted={true}` for login/register pages
- Use `restricted={false}` or omit for marketing/info pages
- Provide `onRedirect` callback for navigation
- Store return URLs in sessionStorage for deep linking
- Clear sessionStorage after successful redirect

### ❌ DON'T

- Don't use PublicRoute for protected content (use ProtectedRoute instead)
- Don't use for role-based access control (PublicRoute doesn't check roles)
- Don't forget to handle the onRedirect callback
- Don't store sensitive data in sessionStorage (only paths/page names)

## Examples

### Example 1: About Page (Unrestricted)

```jsx
<PublicRoute>
  <div className="about-page">
    <h1>About THCT Clinic</h1>
    <p>Available to all visitors...</p>
  </div>
</PublicRoute>
```

### Example 2: Login Page (Restricted)

```jsx
<PublicRoute 
  restricted={true}
  redirectTo="dashboard"
  onRedirect={(page) => setCurrentPage(page)}
>
  <div className="login-page">
    <LoginForm />
  </div>
</PublicRoute>
```

### Example 3: Registration Page with Custom Redirect

```jsx
<PublicRoute 
  restricted={true}
  redirectTo="profile"
  onRedirect={(page) => {
    console.log(`Redirecting to ${page}`);
    setCurrentPage(page);
  }}
>
  <div className="register-page">
    <RegisterForm />
  </div>
</PublicRoute>
```

## Troubleshooting

### Authenticated users still see login page
- Check `restricted={true}` is set
- Verify `useAuth()` returns correct `isAuthenticated` value
- Check `onRedirect` callback is provided and working

### Return URL not working
- Verify sessionStorage is available in browser
- Check URL is stored correctly in sessionStorage as 'returnUrl'
- Ensure sessionStorage is not being cleared prematurely

### Infinite redirect loop
- Don't use PublicRoute with `restricted={true}` on the default redirect page
- Example: Don't wrap dashboard with `<PublicRoute restricted={true} redirectTo="dashboard">`

## Related Components

- **ProtectedRoute**: For authenticated content with role-based access control
- **AuthContext**: Provides authentication state and methods
- **AuthModal**: Modal-based login/register (currently used in THCT Clinic)

## Future Enhancements

Potential improvements for PublicRoute:

1. **Redirect History**: Track navigation history for better UX
2. **Redirect Delay**: Configurable delay before redirect
3. **Custom Redirect UI**: Support for custom redirect messages/animations
4. **Multi-step Redirect**: Support for redirect chains
5. **Analytics Integration**: Track redirect events for analytics

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Support for restricted/unrestricted public pages
- Return URL handling for deep linking
- Loading states and authentication checks
- Shared CSS with ProtectedRoute
- Comprehensive unit tests (31 tests)

---

**Component Status**: ✅ Complete and tested  
**Requirements**: ✅ Requirement 2.6 validated  
**Test Coverage**: 31/31 tests passing
