/**
 * Global test setup for EduSphere Backend comprehensive testing
 */

// Set test timeout for all tests
jest.setTimeout(30000);

// Global test configuration
beforeAll(async () => {
  // Setup global test environment
  console.log('🚀 Starting EduSphere Backend comprehensive test suite...');
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/edusphere_test';
});

afterAll(async () => {
  console.log('✅ EduSphere Backend test suite completed.');
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase Node.js memory limit for performance tests
if (process.env.NODE_OPTIONS) {
  process.env.NODE_OPTIONS += ' --max-old-space-size=4096';
} else {
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
}

// Mock console methods for cleaner test output in CI
if (process.env.CI) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error, // Keep error for debugging
  };
}