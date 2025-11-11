import { protect, restrictTo } from '../../src/middlewares/authMiddleware.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { generateToken } from '../../src/utils/jwt.js';
import User from '../../src/models/userModel.js';

describe('Auth Middleware', () => {
  describe('protect', () => {
    let req, res, next;
    let originalFindById;

    beforeEach(() => {
      req = {
        headers: {},
        user: null
      };
      res = {
        status: function(code) { 
          this.statusCode = code; 
          return this; 
        },
        json: function(data) { 
          this.jsonData = data; 
          return this; 
        }
      };
      next = function() { next.called = true; };
      next.called = false;
      
      // Guardar el método original
      originalFindById = User.findById;
    });

    afterEach(() => {
      // Restaurar el método original
      User.findById = originalFindById;
    });

    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        isActive: true
      };

      const token = generateToken(mockUser.id);
      req.headers.authorization = `Bearer ${token}`;

      User.findById = async () => mockUser;

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next.called).toBe(true);
      expect(res.statusCode).toBeUndefined();
    });

    it('should reject request without authorization header', async () => {
      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.status).toBe('fail');
      expect(next.called).toBe(false);
    });

    it('should reject request with malformed authorization header', async () => {
      req.headers.authorization = 'InvalidToken';

      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.status).toBe('fail');
      expect(next.called).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token-string';

      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.status).toBe('fail');
      expect(next.called).toBe(false);
    });

    it('should reject if user not found in database', async () => {
      const token = generateToken('non-existent-user');
      req.headers.authorization = `Bearer ${token}`;

      User.findById = async () => null;

      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.status).toBe('fail');
      expect(next.called).toBe(false);
    });

    it('should reject if user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        isActive: false
      };

      const token = generateToken(mockUser.id);
      req.headers.authorization = `Bearer ${token}`;

      User.findById = async () => mockUser;

      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.status).toBe('fail');
      expect(next.called).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const token = generateToken('user-123');
      req.headers.authorization = `Bearer ${token}`;

      User.findById = async () => { throw new Error('Database error'); };

      await protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.status).toBe('fail');
    });
  });

  describe('restrictTo', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        user: null
      };
      res = {
        status: function(code) { 
          this.statusCode = code; 
          return this; 
        },
        json: function(data) { 
          this.jsonData = data; 
          return this; 
        }
      };
      next = function() { next.called = true; };
      next.called = false;
    });

    it('should allow access for authorized role', () => {
      req.user = { role: 'admin' };
      const middleware = restrictTo('admin');

      middleware(req, res, next);

      expect(next.called).toBe(true);
      expect(res.statusCode).toBeUndefined();
    });

    it('should allow access for multiple authorized roles', () => {
      req.user = { role: 'user' };
      const middleware = restrictTo('admin', 'user', 'manager');

      middleware(req, res, next);

      expect(next.called).toBe(true);
      expect(res.statusCode).toBeUndefined();
    });

    it('should deny access for unauthorized role', () => {
      req.user = { role: 'user' };
      const middleware = restrictTo('admin');

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData.status).toBe('fail');
      expect(next.called).toBe(false);
    });

    it('should deny access when user is not authenticated', () => {
      req.user = null;
      const middleware = restrictTo('admin');

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData.status).toBe('fail');
      expect(next.called).toBe(false);
    });

    it('should deny access when user has no role', () => {
      req.user = { id: '123' }; // Usuario sin rol
      const middleware = restrictTo('admin');

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next.called).toBe(false);
    });
  });
});

describe('Error Handler Middleware', () => {
  let req, res, next, consoleErrorSpy;

  beforeEach(() => {
    req = {};
    res = {
      status: function(code) { 
        this.statusCode = code; 
        return this; 
      },
      json: function(data) { 
        this.jsonData = data; 
        return this; 
      }
    };
    next = function() { next.called = true; };
    next.called = false;
    
    // Suppress console.error during tests
    consoleErrorSpy = console.error;
    console.error = () => {};
  });

  afterEach(() => {
    console.error = consoleErrorSpy;
  });

  it('should handle validation errors', () => {
    const error = new Error('Validation error');
    error.name = 'ValidationError';

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.status).toBe('fail');
  });

  it('should handle generic errors with status code', () => {
    const error = new Error('Custom error');
    error.statusCode = 404;

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.status).toBe('fail');
    expect(res.jsonData.message).toBe('Custom error');
  });

  it('should handle errors without status code (500)', () => {
    const error = new Error('Unexpected error');

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.status).toBe('error');
    expect(res.jsonData.message).toBe('Unexpected error');
  });

  it('should include stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Dev error');
    error.stack = 'Error stack trace';

    errorHandler(error, req, res, next);

    expect(res.jsonData.stack).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Prod error');
    error.stack = 'Error stack trace';

    errorHandler(error, req, res, next);

    expect(res.jsonData.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle SQLite errors', () => {
    const error = new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed');
    error.code = 'SQLITE_CONSTRAINT';

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.status).toBe('fail');
  });

  it('should handle errors with explicit statusCode', () => {
    const error = new Error('Custom error');
    error.statusCode = 422;

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(422);
    expect(res.jsonData.status).toBe('fail');
  });
});
