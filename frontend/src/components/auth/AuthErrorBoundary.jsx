import React from 'react';
import AuthErrorFallback from './AuthErrorFallback';

/**
 * React Error Boundary for Authentication Components
 * 
 * Implements graceful error handling for React component errors
 * in the authentication flow following the pattern from design document
 * 
 * Features:
 * - Catches React rendering errors in authentication components
 * - Provides fallback UI with retry options
 * - Logs errors for monitoring and debugging
 * - Prevents authentication errors from crashing the entire app
 * 
 * Validates Requirements:
 * - Error handling requirements from design document
 * - Graceful degradation for authentication flows
 */
class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render shows fallback UI
    return { 
      hasError: true, 
      error: error 
    };
  }

  /**
   * Log error details and track error occurrences
   */
  componentDidCatch(error, errorInfo) {
    // Log error to console and monitoring service
    console.error('Auth Error Boundary caught an error:', {
      error: error,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Track error count for detecting repeated failures
    this.setState(prevState => ({
      errorInfo: errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // In production, send to error monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
      console.info('In production, this error would be sent to monitoring service');
    }

    // If error occurs too many times, may indicate serious issue
    if (this.state.errorCount >= 5) {
      console.error('Authentication error occurred multiple times, may require user action');
    }
  }

  /**
   * Reset error boundary state to retry rendering
   */
  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
      // Keep errorCount to track repeated failures
    });

    // Call optional reset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Navigate user to home or login page
   */
  handleNavigateAway = () => {
    // Clear error state
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    });

    // Navigate to safe page
    if (this.props.onNavigateAway) {
      this.props.onNavigateAway();
    } else {
      // Default navigation
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <AuthErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
          onNavigateAway={this.handleNavigateAway}
          resetButtonText={this.props.resetButtonText}
          showTechnicalDetails={this.props.showTechnicalDetails || process.env.NODE_ENV === 'development'}
        />
      );
    }

    // Normal rendering when no error
    return this.props.children;
  }
}

export default AuthErrorBoundary;
