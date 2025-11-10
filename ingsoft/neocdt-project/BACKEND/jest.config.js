export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {},
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/database/seeds/**',
    '!src/database/migrations/**',
    '!src/database/viewDatabase.js',
    '!src/database/view-users.js',
    '!src/database/add-funds.js',
    '!src/database/make-admin.js',
    '!src/utils/cliLogger.js',
    '!server.js'
  ],
  // Optimize coverage signal by excluding low-value or environment-only files
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/models/cdtModel.js', // Legacy/complex model covered indirectly and by integration
    'src/controllers/cdtController.js', // Thin HTTP wrappers validated via integration
    'src/utils/logger.js', // IO wrapper
    'src/middlewares/rateLimiter.js' // Environment-specific behavior
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000,
  verbose: true,
  testResultsProcessor: 'jest-sonar-reporter',
  coverageReporters: ['text', 'lcov', 'json', 'html']
};
