/**
 * Comprehensive Tests for AsyncHandler Utility
 * 
 * Target: Increase asyncHandler.js from 76% to 95%+
 * Focus on: Error handling, redaction, helper functions
 */

import { beforeEach, describe, it, expect, jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

// Import after mocking
const { logger } = await import('../../src/utils/logger.js');
const { asyncHandler, sendSuccess, sendCreated, sendError } = await import('../../src/utils/asyncHandler.js');

describe('AsyncHandler Utility - Comprehensive Coverage', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: {
        id: 'user-123',
        role: 'user'
      },
      method: 'POST',
      path: '/api/v1/test',
      params: { id: 'test-id' },
      query: { filter: 'active' },
      body: { data: 'test' },
      ip: '192.168.1.1',
      get: jest.fn((header) => 
        header === 'user-agent' ? 'Mozilla/5.0' : undefined
      )
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('asyncHandler - Main Wrapper', () => {
    it('should execute async function successfully', async () => {
      // Arrange
      const mockHandler = jest.fn(async (req, res) => {
        res.status(200).json({ status: 'success' });
      });
      const wrappedHandler = asyncHandler(mockHandler, 'testHandler', 'test-action');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle errors with statusCode', async () => {
      // Arrange
      const error = new Error('Resource not found');
      error.statusCode = 404;
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'testHandler', 'get-resource');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error en testHandler',
        expect.objectContaining({
          error: 'Resource not found',
          stack: expect.any(String),
          userId: 'user-123',
          userRole: 'user',
          action: 'get-resource',
          method: 'POST',
          path: '/api/v1/test'
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Resource not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass errors without statusCode to next middleware', async () => {
      // Arrange
      const error = new Error('Unexpected error');
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'testHandler', 'test-action');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should redact sensitive body for password actions', async () => {
      // Arrange
      mockReq.body = { password: 'secret123', email: 'test@test.com' };
      const error = new Error('Validation error');
      error.statusCode = 400;
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'changePassword', 'password-change');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error en changePassword',
        expect.objectContaining({
          body: '[REDACTED]'
        })
      );
    });

    it('should redact sensitive body for login actions', async () => {
      // Arrange
      mockReq.body = { email: 'user@test.com', password: 'pass123' };
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'login', 'user-login');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error en login',
        expect.objectContaining({
          body: '[REDACTED]'
        })
      );
    });

    it('should include non-sensitive body for non-password actions', async () => {
      // Arrange
      mockReq.body = { name: 'Test User', email: 'test@test.com' };
      const error = new Error('Validation error');
      error.statusCode = 400;
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'createUser', 'user-creation');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error en createUser',
        expect.objectContaining({
          body: { name: 'Test User', email: 'test@test.com' }
        })
      );
    });

    it('should handle request without user', async () => {
      // Arrange
      delete mockReq.user;
      const error = new Error('Authentication required');
      error.statusCode = 401;
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'protectedRoute', 'access-resource');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error en protectedRoute',
        expect.objectContaining({
          userId: undefined,
          userRole: undefined
        })
      );
    });

    it('should handle request without get method', async () => {
      // Arrange
      delete mockReq.get;
      const error = new Error('Test error');
      error.statusCode = 500;
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'testHandler', 'test-action');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error en testHandler',
        expect.objectContaining({
          userAgent: undefined
        })
      );
    });

    it('should include timestamp in error log', async () => {
      // Arrange
      const error = new Error('Test error');
      error.statusCode = 400;
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'testHandler', 'test-action');
      const beforeTimestamp = new Date().toISOString();

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);
      const afterTimestamp = new Date().toISOString();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Error en testHandler',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );

      const loggedTimestamp = logger.error.mock.calls[0][1].timestamp;
      expect(loggedTimestamp >= beforeTimestamp && loggedTimestamp <= afterTimestamp).toBe(true);
    });
  });

  describe('sendSuccess - Helper Function', () => {
    it('should send success response with default status 200', () => {
      // Arrange
      const data = { user: { id: '123', name: 'Test' } };

      // Act
      sendSuccess(mockRes, data);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: { id: '123', name: 'Test' } }
      });
    });

    it('should send success response with custom status code', () => {
      // Arrange
      const data = { message: 'Partial content' };

      // Act
      sendSuccess(mockRes, data, 206);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(206);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { message: 'Partial content' }
      });
    });

    it('should include metadata in response', () => {
      // Arrange
      const data = { users: [] };
      const meta = {
        pagination: {
          page: 1,
          limit: 20,
          total: 100
        }
      };

      // Act
      sendSuccess(mockRes, data, 200, meta);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { users: [] },
        pagination: {
          page: 1,
          limit: 20,
          total: 100
        }
      });
    });

    it('should handle empty data', () => {
      // Act
      sendSuccess(mockRes, {});

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {}
      });
    });

    it('should handle null data', () => {
      // Act
      sendSuccess(mockRes, null);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: null
      });
    });

    it('should handle array data', () => {
      // Arrange
      const data = [1, 2, 3, 4, 5];

      // Act
      sendSuccess(mockRes, data);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: [1, 2, 3, 4, 5]
      });
    });
  });

  describe('sendCreated - Helper Function', () => {
    it('should send 201 created response', () => {
      // Arrange
      const data = { cdt: { id: 'cdt-123', amount: 1000000 } };

      // Act
      sendCreated(mockRes, data);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { cdt: { id: 'cdt-123', amount: 1000000 } }
      });
    });

    it('should include metadata in created response', () => {
      // Arrange
      const data = { user: { id: 'user-456' } };
      const meta = { message: 'Welcome email sent' };

      // Act
      sendCreated(mockRes, data, meta);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: { id: 'user-456' } },
        message: 'Welcome email sent'
      });
    });

    it('should handle empty metadata', () => {
      // Arrange
      const data = { resource: 'created' };

      // Act
      sendCreated(mockRes, data, {});

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { resource: 'created' }
      });
    });
  });

  describe('sendError - Helper Function', () => {
    it('should send error response with default status 400', () => {
      // Arrange
      const message = 'Validation failed';

      // Act
      sendError(mockRes, message);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Validation failed'
      });
    });

    it('should send error response with custom status code', () => {
      // Arrange
      const message = 'Not found';

      // Act
      sendError(mockRes, message, 404);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Not found'
      });
    });

    it('should include validation errors', () => {
      // Arrange
      const message = 'Validation failed';
      const errors = [
        { field: 'email', message: 'Invalid format' },
        { field: 'password', message: 'Too short' }
      ];

      // Act
      sendError(mockRes, message, 400, errors);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too short' }
        ]
      });
    });

    it('should not include errors field when errors is null', () => {
      // Arrange
      const message = 'Something went wrong';

      // Act
      sendError(mockRes, message, 500, null);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Something went wrong'
      });
      
      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.hasOwnProperty('errors')).toBe(false);
    });

    it('should handle empty errors array', () => {
      // Arrange
      const message = 'Error occurred';

      // Act
      sendError(mockRes, message, 400, []);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Error occurred',
        errors: []
      });
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle multiple async operations', async () => {
      // Arrange
      let callCount = 0;
      const mockHandler = jest.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return { success: true };
        }
      });
      const wrappedHandler = asyncHandler(mockHandler, 'multiOp', 'multi-action');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should handle errors with additional properties', async () => {
      // Arrange
      const error = new Error('Custom error');
      error.statusCode = 422;
      error.code = 'DUPLICATE_ENTRY';
      error.field = 'email';
      const mockHandler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = asyncHandler(mockHandler, 'testHandler', 'test-action');

      // Act
      await wrappedHandler(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
