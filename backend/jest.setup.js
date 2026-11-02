// Jest setup file for environment variables and global mocks

// Set required environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-min-256-bits';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'test';

// Mock console.log to reduce test noise unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};