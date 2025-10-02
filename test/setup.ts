// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-playground-test';

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = (...args) => {
  if (process.env.VERBOSE_TESTS === 'true') {
    originalConsoleLog(...args);
  }
};

console.warn = (...args) => {
  if (process.env.VERBOSE_TESTS === 'true') {
    originalConsoleWarn(...args);
  }
};

console.error = (...args) => {
  if (process.env.VERBOSE_TESTS === 'true') {
    originalConsoleError(...args);
  }
};
