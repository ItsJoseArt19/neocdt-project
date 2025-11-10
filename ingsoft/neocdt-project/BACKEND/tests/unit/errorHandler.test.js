import { jest } from '@jest/globals';

const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

const noop = jest.fn();

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: mockLogger,
  logRequest: noop,
  logDatabase: noop,
  logAuth: noop
}));

let errorHandler;

beforeAll(async () => {
  const module = await import('../../src/middlewares/errorHandler.js');
  errorHandler = module.errorHandler;
});

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler - complete coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle validation errors with 400', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.details = [{ message: 'Email required' }];
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'fail',
      message: expect.stringContaining('validaci')
    }));
  });

  it('should handle JWT errors as 401', () => {
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Token')
    }));
  });

  it('should handle TokenExpiredError as 401', () => {
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle SQLite UNIQUE constraint errors as 400', () => {
    const error = new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email');
    error.code = 'SQLITE_CONSTRAINT';
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('duplicado')
    }));
  });

  it('should handle CSRF token errors as 403', () => {
    const error = new Error('Invalid CSRF token');
    error.code = 'EBADCSRFTOKEN';
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('CSRF')
    }));
  });

  it('should include stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Dev error');
    error.statusCode = 500;
    error.stack = 'Error stack trace here';
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      stack: 'Error stack trace here'
    }));

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Prod error');
    error.statusCode = 500;
    error.stack = 'Secret stack trace';
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.not.objectContaining({
      stack: expect.anything()
    }));

    process.env.NODE_ENV = originalEnv;
  });

  it('should use custom statusCode from error', () => {
    const error = new Error('Custom error');
    error.statusCode = 422;
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('should default to 500 for unknown errors', () => {
    const error = new Error('Unknown error');
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      message: 'Unknown error'
    }));
  });

  it('should log error details', () => {
    const error = new Error('Logged error');
    error.statusCode = 500;
    const req = { ip: '127.0.0.1', method: 'POST', originalUrl: '/api/test' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error'),
      expect.objectContaining({
        message: 'Logged error',
        method: 'POST',
        ip: '127.0.0.1'
      })
    );
  });

  it('should handle errors without message', () => {
    const error = new Error();
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.any(String)
    }));
  });

  it('should handle rate limit errors', () => {
    const error = new Error('Too many requests');
    error.statusCode = 429;
    const req = { ip: '127.0.0.1' };
    const res = createRes();
    const next = jest.fn();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
  });
});
