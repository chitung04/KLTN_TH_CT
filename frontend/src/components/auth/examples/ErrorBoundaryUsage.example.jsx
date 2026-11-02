import React from 'react';
import { AuthErrorBoundary } from '../index';
import LoginForm from '../LoginForm';
import RegisterForm from '../RegisterForm';

/**
 * Example Usage of AuthErrorBoundary Component
 * 
 * This file demonstrates how to use the AuthErrorBoundary to wrap
 * authentication components and provide graceful error handling.
 */

/**
 * Example 1: Basic Usage - Wrap authentication forms
 */
export const BasicExample = () => {
  return (
    <AuthErrorBoundary>
      <LoginForm />
    </AuthErrorBoundary>
  );
};

/**
 * Example 2: With Custom Callbacks
 */
export const WithCallbacksExample = () => {
  const handleReset = () => {
    console.log('User clicked reset, clearing any cached state...');
    // Clear cached authentication state
    // Reload component
  };

  const handleNavigateAway = () => {
    console.log('User navigating away from error...');
    window.location.href = '/';
  };

  return (
    <AuthErrorBoundary
      onReset={handleReset}
      onNavigateAway={handleNavigateAway}
      resetButtonText="Thử lại ngay"
    >
      <RegisterForm />
    </AuthErrorBoundary>
  );
};

/**
 * Example 3: Production vs Development Mode
 */
export const ProductionExample = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <AuthErrorBoundary showTechnicalDetails={isDevelopment}>
      <LoginForm />
    </AuthErrorBoundary>
  );
};

/**
 * Example 4: Wrapping Multiple Components
 */
export const MultipleComponentsExample = () => {
  return (
    <AuthErrorBoundary>
      <div>
        <header>
          <h1>Welcome to THCT Clinic</h1>
        </header>
        <main>
          <LoginForm />
        </main>
      </div>
    </AuthErrorBoundary>
  );
};

/**
 * Example 5: Nested Error Boundaries for Different Error Handling
 */
export const NestedExample = () => {
  return (
    <AuthErrorBoundary
      onNavigateAway={() => (window.location.href = '/')}
    >
      <div>
        <h1>Authentication</h1>
        
        {/* Separate error boundary for login form */}
        <AuthErrorBoundary
          resetButtonText="Thử đăng nhập lại"
          onReset={() => console.log('Reset login form')}
        >
          <LoginForm />
        </AuthErrorBoundary>

        <hr />

        {/* Separate error boundary for register form */}
        <AuthErrorBoundary
          resetButtonText="Thử đăng ký lại"
          onReset={() => console.log('Reset register form')}
        >
          <RegisterForm />
        </AuthErrorBoundary>
      </div>
    </AuthErrorBoundary>
  );
};

/**
 * Example 6: Integration with React Router
 */
export const RouterIntegrationExample = () => {
  // Assuming React Router is available
  // import { useNavigate } from 'react-router-dom';
  // const navigate = useNavigate();

  const handleNavigateAway = () => {
    // navigate('/'); // Using React Router
    console.log('Navigate using router');
  };

  return (
    <AuthErrorBoundary onNavigateAway={handleNavigateAway}>
      <LoginForm />
    </AuthErrorBoundary>
  );
};

/**
 * Example 7: App-Level Error Boundary
 * 
 * Wrap the entire app or a major section
 */
export const AppLevelExample = () => {
  return (
    <AuthErrorBoundary
      onReset={() => window.location.reload()}
      onNavigateAway={() => (window.location.href = '/')}
      showTechnicalDetails={process.env.NODE_ENV === 'development'}
    >
      <div className="app">
        {/* Your entire auth section */}
        <LoginForm />
        <RegisterForm />
      </div>
    </AuthErrorBoundary>
  );
};

export default {
  BasicExample,
  WithCallbacksExample,
  ProductionExample,
  MultipleComponentsExample,
  NestedExample,
  RouterIntegrationExample,
  AppLevelExample
};
