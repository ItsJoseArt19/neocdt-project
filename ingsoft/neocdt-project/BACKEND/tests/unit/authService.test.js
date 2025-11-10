import { jest } from '@jest/globals';

const mockUserModel = {
  findByEmail: jest.fn(),
  findByDocument: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
  findByDocumentNumber: jest.fn(),
  findById: jest.fn(),
  updatePassword: jest.fn(),
  comparePassword: jest.fn(),
  count: jest.fn()
};

const mockJwt = {
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn()
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

jest.unstable_mockModule('../../src/models/userModel.js', () => ({
  __esModule: true,
  default: mockUserModel
}));

jest.unstable_mockModule('../../src/utils/jwt.js', () => ({
  __esModule: true,
  generateToken: mockJwt.generateToken,
  generateRefreshToken: mockJwt.generateRefreshToken,
  verifyRefreshToken: mockJwt.verifyRefreshToken
}));

jest.unstable_mockModule('../../src/utils/cache.js', () => ({
  __esModule: true,
  default: mockCache
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger
}));

let authService;

beforeAll(async () => {
  ({ default: authService } = await import('../../src/services/authService.js'));
});

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user when email and document are unique', async () => {
      mockUserModel.findByEmail.mockResolvedValueOnce(null);
      mockUserModel.findByDocument.mockReturnValueOnce(null);
      mockUserModel.create.mockResolvedValueOnce({ id: 'user-1', email: 'neo@matrix.com' });
      mockJwt.generateToken.mockReturnValueOnce('access-token');
      mockJwt.generateRefreshToken.mockReturnValueOnce('refresh-token');

      const result = await authService.register({
        name: 'Neo',
        email: 'neo@matrix.com',
        password: 'Password123!',
        documentType: 'CC',
        documentNumber: '1234567890'
      });

      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockUserModel.updateRefreshToken).toHaveBeenCalledWith('user-1', 'refresh-token');
      expect(result).toEqual(expect.objectContaining({
        user: expect.objectContaining({ email: 'neo@matrix.com' }),
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }));
    });

    it('should throw 400 when email already exists', async () => {
      mockUserModel.findByEmail.mockResolvedValueOnce({ id: 'existing' });

      await expect(authService.register({ email: 'taken@neo.com' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 400 when document already exists', async () => {
      mockUserModel.findByEmail.mockResolvedValueOnce(null);
      mockUserModel.findByDocument.mockReturnValueOnce({ id: 'existing-doc' });

      await expect(authService.register({
        email: 'new@neo.com',
        documentType: 'CC',
        documentNumber: '123'
      })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const userRecord = { id: 'user-1', email: 'neo@matrix.com', password: 'HASH', isActive: true };
      mockUserModel.findByDocument.mockReturnValueOnce(userRecord);
      mockUserModel.comparePassword.mockResolvedValueOnce(true);
      mockJwt.generateToken.mockReturnValueOnce('access');
      mockJwt.generateRefreshToken.mockReturnValueOnce('refresh');

      const result = await authService.login({ documentType: 'CC', documentNumber: '123', password: 'Password123!' });

      expect(mockUserModel.findByDocument).toHaveBeenCalledWith('CC', '123', true);
      expect(mockUserModel.updateRefreshToken).toHaveBeenCalledWith('user-1', 'refresh');
      expect(result).toEqual(expect.objectContaining({ accessToken: 'access', refreshToken: 'refresh' }));
    });

    it('should throw 401 when user not found', async () => {
      mockUserModel.findByDocument.mockReturnValueOnce(null);

      await expect(authService.login({ documentType: 'CC', documentNumber: 'missing', password: 'x' })).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 401 when password mismatch', async () => {
      mockUserModel.findByDocument.mockReturnValueOnce({ id: 'user-1', password: 'HASH', isActive: true });
      mockUserModel.comparePassword.mockResolvedValueOnce(false);

      await expect(authService.login({ documentType: 'CC', documentNumber: '123', password: 'wrong' })).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 403 when user inactive', async () => {
      mockUserModel.findByDocument.mockReturnValueOnce({ id: 'user-1', password: 'HASH', isActive: false });
      mockUserModel.comparePassword.mockResolvedValueOnce(true);

      await expect(authService.login({ documentType: 'CC', documentNumber: '123', password: 'Password123!' })).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('refreshAccessToken', () => {
    it('should issue new access token when refresh token valid', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedToken = await bcrypt.hash('plain-refresh-token', 10);
      
      mockJwt.verifyRefreshToken.mockReturnValueOnce({ userId: 'user-1' });
      mockUserModel.findById.mockResolvedValueOnce({ id: 'user-1', refreshToken: hashedToken });
      mockJwt.generateToken.mockReturnValueOnce('new-access');

      const result = await authService.refreshAccessToken('plain-refresh-token');

      expect(mockJwt.generateToken).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ accessToken: 'new-access' });
    });

    it('should throw when refresh token missing', async () => {
      await expect(authService.refreshAccessToken()).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw when refresh token invalid', async () => {
      mockJwt.verifyRefreshToken.mockImplementationOnce(() => { throw new Error('bad token'); });

      await expect(authService.refreshAccessToken('invalid')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should throw 401 when stored refresh token mismatch', async () => {
      mockJwt.verifyRefreshToken.mockReturnValueOnce({ id: 'user-1' });
      mockUserModel.findById.mockResolvedValueOnce({ id: 'user-1', refreshToken: 'different' });

      await expect(authService.refreshAccessToken('stored-refresh')).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('logout', () => {
    it('should clear refresh token and cache', async () => {
      mockCache.delete.mockReturnValueOnce(true);

      const result = await authService.logout('user-1');

      expect(mockUserModel.updateRefreshToken).toHaveBeenCalledWith('user-1', null);
      expect(mockCache.delete).toHaveBeenCalledWith('user:user-1');
      expect(result).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should return cached profile when available', async () => {
      mockCache.get.mockReturnValueOnce({ id: 'cached-user' });

      const user = await authService.getProfile('cached-user');

      expect(user).toEqual({ id: 'cached-user' });
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });

    it('should load profile from database and cache it', async () => {
      mockCache.get.mockReturnValueOnce(null);
      mockUserModel.findById.mockResolvedValueOnce({ id: 'user-1', email: 'neo@matrix.com', password: 'HASH', refreshToken: 'rt' });

      const user = await authService.getProfile('user-1');

      expect(mockUserModel.findById).toHaveBeenCalledWith('user-1');
      expect(mockCache.set).toHaveBeenCalledWith('user:user-1', expect.objectContaining({ email: 'neo@matrix.com' }), 300000);
      expect(user).toEqual(expect.objectContaining({ email: 'neo@matrix.com' }));
    });

    it('should throw 404 when profile not found', async () => {
      mockCache.get.mockReturnValueOnce(null);
      mockUserModel.findById.mockResolvedValueOnce(null);

      await expect(authService.getProfile('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
