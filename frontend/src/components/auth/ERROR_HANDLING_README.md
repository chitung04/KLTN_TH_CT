# Authentication Error Handling System

Complete error handling implementation for the THCT Clinic authentication system with graceful degradation, network detection, and user-friendly fallback UI.

## Overview

This error handling system provides:

- **React Error Boundaries** for catching component errors
- **Graceful degradation** with user-friendly fallback UI
- **Network status detection** and offline mode handling
- **Auto-retry logic** for recoverable errors
- **Technical details** for debugging (dev mode)
- **Accessibility** features with proper ARIA attributes

## Components

### 1. AuthErrorBoundary

React Error Boundary that catches errors in authentication components and displays a fallback UI.

**Features:**
- Catches React rendering errors
- Logs errors for monitoring
- Tracks error count for repeated failures
- Provides reset functionality
- Allows navigation away from error state

**Usage:**
```jsx
import { AuthErrorBoundary } from './components/auth';

<AuthErrorBoundary
  onReset={() => console.log('Reset clicked')}
  onNavigateAway={() => window.location.href = '/'}
  resetButtonText="Thử lại"
  showTechnicalDetails={process.env.NODE_ENV === 'development'}
>
  <LoginForm />
</AuthErrorBoundary>
```

**Props:**
- `children` (ReactNode): Components to wrap
- `onReset` (function): Callback when reset button is clicked
- `onNavigateAway` (function): Callback when navigate away button is clicked
- `resetButtonText` (string): Custom text for reset button (default: "Thử lại")
- `showTechnicalDetails` (boolean): Show technical error details (default: dev mode only)

### 2. AuthErrorFallback

Fallback UI component displayed when errors are caught.

**Features:**
- User-friendly error messages based on error type
- Network status indicators (offline, slow connection)
- Retry button with loading states
- Auto-retry countdown for network errors
- Repeated error warning
- Technical details toggle (dev mode)
- Contact information for support

**Error Types Handled:**
- Network errors (`NETWORK_ERROR`)
- Token expiration (`TOKEN_EXPIRED`)
- Rate limiting (`RATE_LIMITED`)
- Timeout errors
- Generic authentication errors

**Usage:**
```jsx
<AuthErrorFallback
  error={errorObject}
  errorInfo={reactErrorInfo}
  errorCount={3}
  onReset={() => console.log('Reset')}
  onNavigateAway={() => console.log('Navigate away')}
  resetButtonText="Thử lại"
  showTechnicalDetails={true}
/>
```

**Props:**
- `error` (Error): The error object that was thrown
- `errorInfo` (object): React error info with component stack
- `errorCount` (number): Number of times error has occurred
- `onReset` (function): Callback for retry action
- `onNavigateAway` (function): Callback for navigation
- `resetButtonText` (string): Custom reset button text
- `showTechnicalDetails` (boolean): Show debug information

### 3. useNetworkStatus Hook

Custom hook for real-time network status detection and monitoring.

**Features:**
- Online/offline detection
- Slow connection detection
- Connection type detection (4G, WiFi, etc.)
- Download speed monitoring (Mbps)
- Round-trip time (RTT) monitoring
- Automatic updates on network changes

**Usage:**
```jsx
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

function MyComponent() {
  const { isOnline, isSlowConnection, connectionType, downlink, rtt, effectiveType } = useNetworkStatus();

  if (!isOnline) {
    return <div>Bạn đang ngoại tuyến</div>;
  }

  if (isSlowConnection) {
    return <div>Kết nối chậm - {effectiveType}</div>;
  }

  return <div>Trực tuyến - {connectionType}</div>;
}
```

**Return Values:**
- `isOnline` (boolean): Whether device is connected to network
- `isSlowConnection` (boolean): Whether connection is slow (< 1Mbps or 2G)
- `connectionType` (string|null): Connection type (wifi, cellular, ethernet, etc.)
- `downlink` (number|null): Download speed in Mbps
- `rtt` (number|null): Round-trip time in milliseconds
- `effectiveType` (string|null): Effective connection type (4g, 3g, 2g, slow-2g)

### 4. usePingTest Hook

Hook for performing real connectivity checks via HTTP requests.

**Features:**
- Real HTTP ping to verify connectivity
- Response time measurement
- Automatic retries at intervals
- Custom URL support

**Usage:**
```jsx
import { usePingTest } from '../../hooks/useNetworkStatus';

function MyComponent() {
  const { isReachable, lastChecked, responseTime, checking, refresh } = usePingTest();

  return (
    <div>
      <p>API Reachable: {isReachable ? 'Yes' : 'No'}</p>
      <p>Response Time: {responseTime}ms</p>
      <button onClick={refresh}>Test Now</button>
    </div>
  );
}
```

**Return Values:**
- `isReachable` (boolean): Whether API is reachable
- `lastChecked` (Date|null): Last check timestamp
- `responseTime` (number|null): Response time in milliseconds
- `checking` (boolean): Whether currently checking
- `refresh` (function): Manually trigger a ping test

## Error Handling Strategies

### 1. Graceful Degradation

When errors occur, the system shows user-friendly messages and provides recovery options rather than crashing:

```jsx
// Error boundary catches errors and shows fallback
<AuthErrorBoundary>
  <LoginForm /> {/* May throw error */}
</AuthErrorBoundary>
```

### 2. Auto-Retry Logic

For network errors, the system automatically retries after a countdown:

- Initial retry after 5 seconds
- Up to 3 automatic retry attempts
- Manual retry always available
- Exponential backoff for API requests (in authAPI.js)

### 3. Network-Aware Behavior

Different behavior based on network status:

```jsx
const { isOnline, isSlowConnection } = useNetworkStatus();

if (!isOnline) {
  // Show offline message, enable auto-retry
} else if (isSlowConnection) {
  // Show slow connection warning, adjust UX
} else {
  // Normal operation
}
```

### 4. Error Type Detection

Custom error messages based on error type:

- **Network Error**: "Không thể kết nối đến máy chủ"
- **Token Expired**: "Phiên đăng nhập hết hạn"
- **Rate Limited**: "Quá nhiều yêu cầu"
- **Timeout**: "Hết thời gian chờ"
- **Generic**: "Đã xảy ra lỗi"

## Integration Examples

### Basic Integration

```jsx
import React from 'react';
import { AuthErrorBoundary } from './components/auth';
import LoginForm from './components/auth/LoginForm';

function App() {
  return (
    <AuthErrorBoundary>
      <LoginForm />
    </AuthErrorBoundary>
  );
}
```

### With Auth Context

```jsx
import { AuthProvider } from './contexts/AuthContext';
import { AuthErrorBoundary } from './components/auth';

function App() {
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </AuthErrorBoundary>
  );
}
```

### Multiple Error Boundaries

```jsx
// App-level boundary for fatal errors
<AuthErrorBoundary onNavigateAway={() => window.location.href = '/'}>
  <div className="app">
    {/* Form-level boundaries for specific errors */}
    <AuthErrorBoundary resetButtonText="Thử đăng nhập lại">
      <LoginForm />
    </AuthErrorBoundary>
    
    <AuthErrorBoundary resetButtonText="Thử đăng ký lại">
      <RegisterForm />
    </AuthErrorBoundary>
  </div>
</AuthErrorBoundary>
```

### With Network Status Display

```jsx
import { useNetworkStatus } from './hooks/useNetworkStatus';

function NetworkAwareAuth() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  return (
    <AuthErrorBoundary>
      {!isOnline && (
        <div className="offline-banner">
          Bạn đang ngoại tuyến. Vui lòng kiểm tra kết nối mạng.
        </div>
      )}
      {isSlowConnection && (
        <div className="slow-connection-banner">
          Kết nối chậm. Thao tác có thể mất thời gian.
        </div>
      )}
      <LoginForm />
    </AuthErrorBoundary>
  );
}
```

## Styling

All components are styled using `AuthForms.css` with the following classes:

### Error Fallback Classes
- `.auth-error-fallback` - Main container
- `.auth-error-error` - Error severity (red border)
- `.auth-error-warning` - Warning severity (orange border)
- `.auth-error-info` - Info severity (blue border)
- `.auth-error-icon` - Icon container
- `.auth-error-title` - Error title
- `.auth-error-message` - Error message text
- `.auth-error-actions` - Button container
- `.auth-error-help` - Help text section

### Network Status Classes
- `.network-status` - Status indicator container
- `.network-status.offline` - Offline indicator (red)
- `.network-status.slow` - Slow connection indicator (orange)

### Technical Details Classes
- `.auth-error-technical` - Technical details section
- `.auth-error-details-toggle` - Toggle button
- `.auth-error-details` - Details container
- `.error-detail-section` - Individual detail section

## Testing

Comprehensive test suite included:

### AuthErrorBoundary Tests
```bash
npm test -- AuthErrorBoundary.test.js
```

Tests cover:
- Error catching and fallback rendering
- Error logging
- Reset functionality
- Navigate away functionality
- Props passing
- Repeated error tracking

### AuthErrorFallback Tests
```bash
npm test -- AuthErrorFallback.test.js
```

Tests cover:
- Different error type messages
- Network status indicators
- Retry functionality
- Technical details toggle
- Auto-retry countdown
- Accessibility features

### useNetworkStatus Tests
```bash
npm test -- useNetworkStatus.test.js
```

Tests cover:
- Online/offline detection
- Slow connection detection
- Connection type detection
- Event listener setup/cleanup
- Network information API integration

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Network Information API**: Progressive enhancement
  - Supported: Chrome, Edge, Opera, Samsung Internet
  - Fallback: Basic online/offline detection only
- **Error Boundaries**: React 16.8+ required

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- Proper ARIA attributes (`role="alert"`, `aria-live="assertive"`)
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Color contrast ratios meet standards

## Performance

- Network status updates are throttled
- Event listeners properly cleaned up
- No memory leaks
- Minimal re-renders
- Lazy-loaded components where possible

## Security Considerations

- Error messages don't expose sensitive information
- Stack traces only shown in development mode
- User-friendly messages in production
- No API keys or tokens in error logs
- Proper error sanitization

## Troubleshooting

### Error Boundary Not Catching Errors

Error boundaries only catch errors in:
- Rendering
- Lifecycle methods
- Constructors of the whole tree below them

They do NOT catch errors in:
- Event handlers (use try-catch)
- Asynchronous code (use try-catch)
- Server-side rendering
- Errors thrown in the error boundary itself

### Network Status Not Updating

1. Check browser support for Network Information API
2. Verify event listeners are properly attached
3. Check console for errors
4. Try manual page reload

### Tests Failing

1. Ensure all dependencies are installed
2. Check for mock setup in test files
3. Verify test environment configuration
4. Check for console warnings/errors

## Future Enhancements

Potential improvements:
- Integration with error monitoring services (Sentry, LogRocket)
- More granular error categorization
- Customizable retry strategies
- Error recovery suggestions based on error type
- Multi-language support for error messages
- Analytics integration for error tracking

## Support

For questions or issues:
- Email: support@thctclinic.vn
- Phone: 090-123-4574

## License

Part of the THCT Clinic Authentication System
© 2024 THCT Clinic. All rights reserved.
