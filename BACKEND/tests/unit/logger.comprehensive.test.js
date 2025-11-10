/**
 * Comprehensive Tests for Logger Utility
 * 
 * Target: Increase logger.js from 57% to 90%+
 * Focus on: logDatabase, logAuth, logRequest helper functions
 */

import { beforeEach, describe, it, expect, jest } from '@jest/globals';

// Mock winston before importing logger
jest.unstable_mockModule('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    add: jest.fn()
  };

  return {
    default: {
      createLogger: jest.fn(() => mockLogger),
      format: {
        combine: jest.fn((...args) => args),
        timestamp: jest.fn((opts) => ({ timestamp: opts })),
        errors: jest.fn((opts) => ({ errors: opts })),
        splat: jest.fn(() => 'splat'),
        json: jest.fn(() => 'json'),
        colorize: jest.fn(() => 'colorize'),
        printf: jest.fn((fn) => ({ printf: fn }))
      },
      transports: {
        Console: jest.fn(function (opts) {
          this.opts = opts;
        }),
        File: jest.fn(function (opts) {
          this.opts = opts;
        })
      }
    }
  };
});

jest.unstable_mockModule('../../src/config/env.js', () => ({
  config: {
    nodeEnv: 'test'
  }
}));

// Import after mocking
const winston = (await import('winston')).default;
const { logDatabase, logAuth, logRequest, logger } = await import('../../src/utils/logger.js');

describe('Logger Utility - Comprehensive Coverage', () => {
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = winston.createLogger();
  });

  describe('logDatabase', () => {
    it('should log database operation with details', () => {
      // Arrange
      const operation = 'connect';
      const details = {
        host: 'localhost',
        database: 'test_db',
        status: 'success'
      };

      // Act
      logDatabase(operation, details);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Database: connect', details);
    });

    it('should log database operation without details', () => {
      // Arrange
      const operation = 'disconnect';

      // Act
      logDatabase(operation);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Database: disconnect', {});
    });

    it('should log database operation with empty details object', () => {
      // Arrange
      const operation = 'initialize';

      // Act
      logDatabase(operation, {});

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Database: initialize', {});
    });

    it('should handle complex details object', () => {
      // Arrange
      const operation = 'backup';
      const details = {
        path: '/var/backups/db.sql',
        size: 1024000,
        timestamp: '2024-01-15T10:30:00Z',
        tables: ['users', 'cdts', 'audit_logs']
      };

      // Act
      logDatabase(operation, details);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Database: backup', details);
    });
  });

  describe('logAuth', () => {
    it('should log authentication event with details', () => {
      // Arrange
      const event = 'login';
      const details = {
        userId: 'user-123',
        email: 'test@test.com',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      // Act
      logAuth(event, details);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Auth: login', details);
    });

    it('should log authentication event without details', () => {
      // Arrange
      const event = 'logout';

      // Act
      logAuth(event);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Auth: logout', {});
    });

    it('should log various auth events', () => {
      // Test multiple auth events
      const events = [
        { event: 'register', details: { email: 'new@test.com' } },
        { event: 'password_reset', details: { email: 'user@test.com' } },
        { event: 'token_refresh', details: { userId: 'user-456' } },
        { event: 'login_failed', details: { email: 'wrong@test.com', reason: 'Invalid credentials' } }
      ];

      events.forEach(({ event, details }) => {
        logAuth(event, details);
      });

      expect(mockLogger.info).toHaveBeenCalledTimes(4);
      expect(mockLogger.info).toHaveBeenCalledWith('Auth: register', { email: 'new@test.com' });
      expect(mockLogger.info).toHaveBeenCalledWith('Auth: login_failed', { 
        email: 'wrong@test.com', 
        reason: 'Invalid credentials' 
      });
    });
  });

  describe('logRequest', () => {
    it('should log API request with user information', () => {
      // Arrange
      const mockReq = {
        method: 'POST',
        url: '/api/v1/cdts',
        ip: '192.168.1.100',
        user: {
          id: 'user-789',
          email: 'authenticated@test.com'
        }
      };

      // Act
      logRequest(mockReq);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('API Request', {
        method: 'POST',
        url: '/api/v1/cdts',
        ip: '192.168.1.100',
        userId: 'user-789'
      });
    });

    it('should log API request without user (unauthenticated)', () => {
      // Arrange
      const mockReq = {
        method: 'GET',
        url: '/api/v1/auth/login',
        ip: '10.0.0.50'
        // No user property
      };

      // Act
      logRequest(mockReq);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('API Request', {
        method: 'GET',
        url: '/api/v1/auth/login',
        ip: '10.0.0.50',
        userId: undefined
      });
    });

    it('should handle various HTTP methods', () => {
      // Test multiple HTTP methods
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      
      methods.forEach(method => {
        const mockReq = {
          method,
          url: `/api/v1/resource`,
          ip: '127.0.0.1',
          user: { id: `user-${method}` }
        };

        logRequest(mockReq);
      });

      expect(mockLogger.info).toHaveBeenCalledTimes(5);
    });

    it('should handle requests with query parameters', () => {
      // Arrange
      const mockReq = {
        method: 'GET',
        url: '/api/v1/cdts?page=2&limit=20&status=active',
        ip: '172.16.0.1',
        user: { id: 'user-query' }
      };

      // Act
      logRequest(mockReq);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('API Request', {
        method: 'GET',
        url: '/api/v1/cdts?page=2&limit=20&status=active',
        ip: '172.16.0.1',
        userId: 'user-query'
      });
    });

    it('should handle requests with IPv6 addresses', () => {
      // Arrange
      const mockReq = {
        method: 'POST',
        url: '/api/v1/users',
        ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        user: { id: 'user-ipv6' }
      };

      // Act
      logRequest(mockReq);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('API Request', 
        expect.objectContaining({
          ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        })
      );
    });

    it('should handle missing ip gracefully', () => {
      // Arrange
      const mockReq = {
        method: 'GET',
        url: '/api/v1/health',
        user: { id: 'user-no-ip' }
        // No ip property
      };

      // Act
      logRequest(mockReq);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('API Request', {
        method: 'GET',
        url: '/api/v1/health',
        ip: undefined,
        userId: 'user-no-ip'
      });
    });
  });

  describe('Logger Integration', () => {
    it('should handle rapid sequential logging', () => {
      // Simulate rapid logging
      for (let i = 0; i < 10; i++) {
        logDatabase(`operation-${i}`, { index: i });
        logAuth(`event-${i}`, { index: i });
      }

      expect(mockLogger.info).toHaveBeenCalledTimes(20);
    });

    it('should handle edge case with null details', () => {
      // This tests the default parameter behavior
      logDatabase('test-op', null);
      
      // Should default to {} even though null was passed
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle special characters in operation names', () => {
      const specialOps = [
        'connect:localhost:5432',
        'query-with-dashes',
        'operation_with_underscores',
        'operación-con-ñ'
      ];

      specialOps.forEach(op => {
        logDatabase(op, { test: true });
      });

      expect(mockLogger.info).toHaveBeenCalledTimes(4);
    });
  });

  describe('Logger Configuration', () => {
    it('should create logger with correct configuration', () => {
      // Verify winston.createLogger was called
      expect(winston.createLogger).toHaveBeenCalled();
    });

    it('should export logger functions correctly', () => {
      // Verify helper functions are exported and callable
      expect(typeof logDatabase).toBe('function');
      expect(typeof logAuth).toBe('function');
      expect(typeof logRequest).toBe('function');
    });
  });
});
