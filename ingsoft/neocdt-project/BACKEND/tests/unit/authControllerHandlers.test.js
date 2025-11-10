import { jest } from '@jest/globals';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn()
};

const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

const noop = jest.fn();

jest.unstable_mockModule('../../src/services/authService.js', () => ({
  __esModule: true,
  default: mockAuthService
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger,
  logDatabase: noop,
  logAuth: noop,
  logRequest: noop
}));

let register;
let login;

beforeAll(async () => {
  const controller = await import('../../src/controllers/authController.js');
  register = controller.register;
  login = controller.login;
});

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const buildReq = (overrides = {}) => ({
  body: {},
  ip: '127.0.0.1',
  ...overrides
});

describe('authController handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should send fail response when service throws known error', async () => {
      const error = new Error('Validation error');
      error.statusCode = 422;
      mockAuthService.register.mockRejectedValueOnce(error);

      const req = buildReq({ body: { email: 'neo@matrix.com' } });
      const res = createRes();
      const next = jest.fn();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'fail',
        message: 'Validation error'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward unknown errors to next middleware', async () => {
      const error = new Error('Unexpected failure');
      mockAuthService.register.mockRejectedValueOnce(error);

      const req = buildReq({ body: { email: 'neo@matrix.com' } });
      const res = createRes();
      const next = jest.fn();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should send fail response when service throws with status code', async () => {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      mockAuthService.login.mockRejectedValueOnce(error);

      const req = buildReq({ body: { documentType: 'CC', documentNumber: '123', password: 'x' } });
      const res = createRes();
      const next = jest.fn();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'fail',
        message: 'Credenciales inválidas'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward unexpected login errors', async () => {
      const error = new Error('login crashed');
      mockAuthService.login.mockRejectedValueOnce(error);

      const req = buildReq({ body: { documentType: 'CC', documentNumber: '123', password: 'x' } });
      const res = createRes();
      const next = jest.fn();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
