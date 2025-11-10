import { jest } from '@jest/globals';

// Preparar mocks en memoria para dependencias
const mockUserModel = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  findByDocument: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  deleteById: jest.fn(),
  updatePassword: jest.fn(),
  comparePassword: jest.fn()
};

const cacheStore = new Map();
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  invalidatePattern: jest.fn()
};

jest.unstable_mockModule('../../src/models/userModel.js', () => ({
  __esModule: true,
  default: mockUserModel
}));

jest.unstable_mockModule('../../src/utils/cache.js', () => ({
  __esModule: true,
  default: mockCache
}));

let userService;
let User;
let cache;

beforeAll(async () => {
  ({ default: userService } = await import('../../src/services/userService.js'));
  ({ default: User } = await import('../../src/models/userModel.js'));
  ({ default: cache } = await import('../../src/utils/cache.js'));
});

// Inicializar implementaciones por defecto de cache para cada prueba
beforeEach(() => {
  cacheStore.clear();

  Object.values(mockUserModel).forEach((fn) => fn.mockReset());
  Object.values(mockCache).forEach((fn) => fn.mockReset());

  mockCache.get.mockImplementation((key) => cacheStore.get(key) ?? null);
  mockCache.set.mockImplementation((key, value, ttl) => {
    cacheStore.set(key, value);
    return true;
  });
  mockCache.delete.mockImplementation((key) => cacheStore.delete(key));
  mockCache.invalidatePattern.mockImplementation(() => 0);
});

describe('userService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Evitar que los mocks afecten otros tests (integración/auth)
    jest.resetModules();
  });

  describe('getUserById', () => {
    it('should return cached user if present', async () => {
      cache.get.mockReturnValueOnce({ id: 'u1', name: 'Cached' });
      const user = await userService.getUserById('u1');
      expect(user.name).toBe('Cached');
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('should fetch user and cache if not cached', async () => {
      cache.get.mockReturnValueOnce(null);
      User.findById.mockResolvedValueOnce({ id: 'u2', name: 'DB User', password: 'x', refreshToken: 'y' });
      const user = await userService.getUserById('u2');
      expect(user).toEqual({ id: 'u2', name: 'DB User' });
      expect(cache.set).toHaveBeenCalled();
    });

    it('should throw 404 if user not found', async () => {
      cache.get.mockReturnValueOnce(null);
      User.findById.mockResolvedValueOnce(null);
      await expect(userService.getUserById('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateUser', () => {
    it('should update and invalidate caches', async () => {
      User.update.mockResolvedValueOnce({ id: 'u3', name: 'Updated' });
      const result = await userService.updateUser('u3', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(cache.delete).toHaveBeenCalledWith('user:u3');
      expect(cache.invalidatePattern).toHaveBeenCalled();
    });

    it('should throw 404 on update missing user', async () => {
      User.update.mockResolvedValueOnce(null);
      await expect(userService.updateUser('missing', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateMe', () => {
    it('should throw if email already in use by different user', async () => {
      User.findByEmail.mockResolvedValueOnce({ id: 'other', email: 'taken@example.com' });
      await expect(userService.updateMe('me', { email: 'taken@example.com' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should update current user and clear cache', async () => {
      User.findByEmail.mockResolvedValueOnce(null);
      User.update.mockResolvedValueOnce({ id: 'me', name: 'Neo', password: 'x', refreshToken: 'y' });
      const user = await userService.updateMe('me', { name: 'Neo' });
      expect(user).toEqual({ id: 'me', name: 'Neo' });
      expect(cache.delete).toHaveBeenCalledWith('user:me');
    });

    it('should throw 404 if user not found on updateMe', async () => {
      User.findByEmail.mockResolvedValueOnce(null);
      User.update.mockResolvedValueOnce(null);
      await expect(userService.updateMe('missing', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteUser', () => {
    it('should delete user and invalidate caches', async () => {
      User.deleteById.mockResolvedValueOnce(true);
      const res = await userService.deleteUser('u4');
      expect(res).toBe(true);
      expect(cache.delete).toHaveBeenCalledWith('user:u4');
    });

    it('should throw 404 if user not found on delete', async () => {
      User.deleteById.mockResolvedValueOnce(false);
      await expect(userService.deleteUser('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('changePassword', () => {
    it('should throw 404 if user not found by email', async () => {
      User.findByEmail.mockResolvedValueOnce(null);
      await expect(userService.changePassword('id', 'mail@x.com', { currentPassword: 'a', newPassword: 'b' })).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw 401 if current password invalid', async () => {
      User.findByEmail.mockResolvedValueOnce({ id: 'id', password: 'HASH' });
      User.comparePassword.mockResolvedValueOnce(false);
      await expect(userService.changePassword('id', 'mail@x.com', { currentPassword: 'wrong', newPassword: 'b' })).rejects.toMatchObject({ statusCode: 401 });
    });

    it('should return true on successful password change', async () => {
      User.findByEmail.mockResolvedValueOnce({ id: 'id', password: 'HASH' });
      User.comparePassword.mockResolvedValueOnce(true);
      User.updatePassword.mockResolvedValueOnce(true);
      const res = await userService.changePassword('id', 'mail@x.com', { currentPassword: 'ok', newPassword: 'new' });
      expect(res).toBe(true);
      expect(User.updatePassword).toHaveBeenCalled();
    });
  });
});
