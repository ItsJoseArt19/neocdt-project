/**
 * Comprehensive Tests for User Service - Additional Coverage
 * 
 * Target: Increase userService.js from 72% to 90%+
 * Focus on:
 * - getAllUsers with various filters (lines 15-51)
 * - updateMe email validation (lines 143-155)
 * - Edge cases and error paths
 */

import { beforeEach, describe, it, expect, jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../../src/models/userModel.js', () => ({
  default: {
    findAll: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    updatePassword: jest.fn(),
    comparePassword: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/utils/cache.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidatePattern: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Import after mocking
const User = (await import('../../src/models/userModel.js')).default;
const cache = (await import('../../src/utils/cache.js')).default;
const { logger } = await import('../../src/utils/logger.js');
const userService = (await import('../../src/services/userService.js')).default;

describe('UserService - Additional Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers - Comprehensive Coverage', () => {
    const mockUsers = [
      { id: 'user-1', name: 'User One', email: 'user1@test.com', role: 'user', is_active: 1 },
      { id: 'user-2', name: 'User Two', email: 'user2@test.com', role: 'admin', is_active: 1 }
    ];

    it('should get all users with default pagination', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue(mockUsers);
      User.count.mockResolvedValue(2);

      // Act
      const result = await userService.getAllUsers({});

      // Assert
      expect(User.findAll).toHaveBeenCalledWith({
        limit: 20,
        offset: 0
      });
      expect(User.count).toHaveBeenCalledWith({
        role: undefined,
        isActive: undefined
      });
      expect(result).toEqual({
        users: mockUsers,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      });
    });

    it('should get users filtered by role', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue([mockUsers[1]]);
      User.count.mockResolvedValue(1);

      // Act
      const result = await userService.getAllUsers({ role: 'admin' });

      // Assert
      expect(User.findAll).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        role: 'admin'
      });
      expect(User.count).toHaveBeenCalledWith({
        role: 'admin',
        isActive: undefined
      });
    });

    it('should get users filtered by isActive status', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue(mockUsers);
      User.count.mockResolvedValue(2);

      // Act
      const result = await userService.getAllUsers({ isActive: true });

      // Assert
      expect(User.findAll).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        isActive: true
      });
      expect(User.count).toHaveBeenCalledWith({
        role: undefined,
        isActive: true
      });
    });

    it('should get users filtered by both role and isActive', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue([mockUsers[1]]);
      User.count.mockResolvedValue(1);

      // Act
      const result = await userService.getAllUsers({ role: 'admin', isActive: true });

      // Assert
      expect(User.findAll).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        role: 'admin',
        isActive: true
      });
      expect(User.count).toHaveBeenCalledWith({
        role: 'admin',
        isActive: true
      });
    });

    it('should handle isActive=false explicitly', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue([]);
      User.count.mockResolvedValue(0);

      // Act
      const result = await userService.getAllUsers({ isActive: false });

      // Assert
      expect(User.findAll).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
        isActive: false
      });
    });

    it('should calculate pagination correctly for multiple pages', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue(mockUsers);
      User.count.mockResolvedValue(45);

      // Act
      const result = await userService.getAllUsers({ page: 2, limit: 10 });

      // Assert
      expect(User.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 10 // (page 2 - 1) * 10
      });
      expect(result.pagination).toEqual({
        total: 45,
        page: 2,
        limit: 10,
        totalPages: 5
      });
    });

    it('should return cached data if available', async () => {
      // Arrange
      const cachedData = {
        users: mockUsers,
        pagination: { total: 2, page: 1, limit: 20, totalPages: 1 }
      };
      cache.get.mockReturnValue(cachedData);

      // Act
      const result = await userService.getAllUsers({});

      // Assert
      expect(cache.get).toHaveBeenCalledWith('users:all:role:all:isActive:all:page:1:limit:20');
      expect(User.findAll).not.toHaveBeenCalled();
      expect(User.count).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
      expect(logger.debug).toHaveBeenCalledWith('Listado de usuarios obtenido del cache');
    });

    it('should set cache after fetching from database', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue(mockUsers);
      User.count.mockResolvedValue(2);

      // Act
      await userService.getAllUsers({ page: 1, limit: 20 });

      // Assert
      expect(cache.set).toHaveBeenCalledWith(
        'users:all:role:all:isActive:all:page:1:limit:20',
        expect.objectContaining({
          users: mockUsers,
          pagination: expect.any(Object)
        }),
        300000
      );
      expect(logger.debug).toHaveBeenCalledWith('Listado de usuarios guardado en cache');
    });

    it('should create unique cache keys for different filters', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue([]);
      User.count.mockResolvedValue(0);

      // Act
      await userService.getAllUsers({ role: 'admin', isActive: true, page: 2, limit: 10 });

      // Assert
      expect(cache.get).toHaveBeenCalledWith('users:all:role:admin:isActive:true:page:2:limit:10');
    });

    it('should handle empty user list', async () => {
      // Arrange
      cache.get.mockReturnValue(null);
      User.findAll.mockResolvedValue([]);
      User.count.mockResolvedValue(0);

      // Act
      const result = await userService.getAllUsers({});

      // Assert
      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('updateMe - Email Validation', () => {
    it('should update user profile when email not in use', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Name',
        email: 'newemail@test.com'
      };
      User.findByEmail.mockResolvedValue(null); // Email not in use
      User.update.mockResolvedValue({
        id: userId,
        name: 'Updated Name',
        email: 'newemail@test.com',
        role: 'user',
        password: 'hashed',
        refreshToken: 'token'
      });

      // Act
      const result = await userService.updateMe(userId, updateData);

      // Assert
      expect(User.findByEmail).toHaveBeenCalledWith('newemail@test.com');
      expect(User.update).toHaveBeenCalledWith(userId, {
        name: 'Updated Name',
        email: 'newemail@test.com'
      });
      expect(result.password).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
      expect(cache.delete).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('should throw error when email already in use by another user', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = { email: 'existing@test.com' };
      User.findByEmail.mockResolvedValue({
        id: 'different-user-456',
        email: 'existing@test.com'
      });

      // Act & Assert
      await expect(userService.updateMe(userId, updateData))
        .rejects
        .toMatchObject({
          message: 'El correo electrónico ya está en uso',
          statusCode: 400
        });
      expect(User.update).not.toHaveBeenCalled();
    });

    it('should allow updating email to same email (same user)', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = { email: 'sameemail@test.com' };
      User.findByEmail.mockResolvedValue({
        id: userId, // Same user
        email: 'sameemail@test.com'
      });
      User.update.mockResolvedValue({
        id: userId,
        email: 'sameemail@test.com',
        password: 'hashed',
        refreshToken: 'token'
      });

      // Act
      const result = await userService.updateMe(userId, updateData);

      // Assert
      expect(User.update).toHaveBeenCalledWith(userId, { email: 'sameemail@test.com' });
      expect(result).toBeDefined();
    });

    it('should throw 404 when user not found in updateMe', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      const updateData = { name: 'New Name' };
      User.findByEmail.mockResolvedValue(null);
      User.update.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateMe(userId, updateData))
        .rejects
        .toMatchObject({
          message: 'Usuario no encontrado',
          statusCode: 404
        });
    });

    it('should update only name without checking email', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = { name: 'Only Name Update' };
      User.update.mockResolvedValue({
        id: userId,
        name: 'Only Name Update',
        email: 'old@test.com',
        password: 'hashed',
        refreshToken: 'token'
      });

      // Act
      const result = await userService.updateMe(userId, updateData);

      // Assert
      expect(User.findByEmail).not.toHaveBeenCalled();
      expect(User.update).toHaveBeenCalledWith(userId, { name: 'Only Name Update' });
    });
  });

  describe('updateUser - Admin Update', () => {
    it('should update user with all fields including role and isActive', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        name: 'Admin Updated',
        email: 'admin@test.com',
        role: 'admin',
        isActive: false
      };
      User.update.mockResolvedValue({
        id: userId,
        name: 'Admin Updated',
        email: 'admin@test.com',
        role: 'admin',
        is_active: 0,
        password: 'hashed',
        refreshToken: 'token'
      });

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(User.update).toHaveBeenCalledWith(userId, {
        name: 'Admin Updated',
        email: 'admin@test.com',
        role: 'admin',
        is_active: 0
      });
      expect(result.password).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
      expect(cache.delete).toHaveBeenCalledWith(`user:${userId}`);
      expect(cache.invalidatePattern).toHaveBeenCalledWith('users:all:*');
    });

    it('should handle isActive true conversion', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = { isActive: true };
      User.update.mockResolvedValue({
        id: userId,
        is_active: 1,
        password: 'hashed',
        refreshToken: 'token'
      });

      // Act
      await userService.updateUser(userId, updateData);

      // Assert
      expect(User.update).toHaveBeenCalledWith(userId, { is_active: 1 });
    });

    it('should throw 404 when user not found in updateUser', async () => {
      // Arrange
      User.update.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUser('nonexistent', { name: 'Test' }))
        .rejects
        .toMatchObject({
          message: 'Usuario no encontrado',
          statusCode: 404
        });
    });
  });

  describe('deleteUser - Cascade Invalidation', () => {
    it('should delete user and invalidate all related caches', async () => {
      // Arrange
      const userId = 'user-123';
      User.deleteById.mockResolvedValue(true);

      // Act
      const result = await userService.deleteUser(userId);

      // Assert
      expect(User.deleteById).toHaveBeenCalledWith(userId);
      expect(cache.delete).toHaveBeenCalledWith(`user:${userId}`);
      expect(cache.invalidatePattern).toHaveBeenCalledWith('users:all:*');
      expect(cache.invalidatePattern).toHaveBeenCalledWith(`cdts:user:${userId}:*`);
      expect(logger.info).toHaveBeenCalledWith(
        `Cache invalidado para usuario ${userId} en deleteUser`
      );
      expect(result).toBe(true);
    });

    it('should throw 404 when user not found in deleteUser', async () => {
      // Arrange
      User.deleteById.mockResolvedValue(false);

      // Act & Assert
      await expect(userService.deleteUser('nonexistent'))
        .rejects
        .toMatchObject({
          message: 'Usuario no encontrado',
          statusCode: 404
        });
    });
  });

  describe('changePassword - Validation', () => {
    it('should change password with valid current password', async () => {
      // Arrange
      const userId = 'user-123';
      const userEmail = 'user@test.com';
      const passwordData = {
        currentPassword: 'oldPass123',
        newPassword: 'newPass456'
      };
      User.findByEmail.mockResolvedValue({
        id: userId,
        email: userEmail,
        password: 'hashedOldPassword'
      });
      User.comparePassword.mockResolvedValue(true);
      User.updatePassword.mockResolvedValue(true);

      // Act
      const result = await userService.changePassword(userId, userEmail, passwordData);

      // Assert
      expect(User.findByEmail).toHaveBeenCalledWith(userEmail, true);
      expect(User.comparePassword).toHaveBeenCalledWith('oldPass123', 'hashedOldPassword');
      expect(User.updatePassword).toHaveBeenCalledWith(userId, 'newPass456');
      expect(result).toBe(true);
    });

    it('should throw 404 when user not found in changePassword', async () => {
      // Arrange
      User.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        userService.changePassword('user-123', 'nonexistent@test.com', {
          currentPassword: 'old',
          newPassword: 'new'
        })
      ).rejects.toMatchObject({
        message: 'Usuario no encontrado',
        statusCode: 404
      });
    });

    it('should throw 401 when current password is incorrect', async () => {
      // Arrange
      User.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        password: 'hashedPassword'
      });
      User.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(
        userService.changePassword('user-123', 'user@test.com', {
          currentPassword: 'wrongPassword',
          newPassword: 'newPass'
        })
      ).rejects.toMatchObject({
        message: 'La contraseña actual es incorrecta',
        statusCode: 401
      });
      expect(User.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('getMe - Current User Profile', () => {
    it('should get current user profile without cache', async () => {
      // Arrange
      const userId = 'user-123';
      User.findById.mockResolvedValue({
        id: userId,
        name: 'Test User',
        email: 'test@test.com',
        password: 'hashed',
        refreshToken: 'token'
      });

      // Act
      const result = await userService.getMe(userId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result.password).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
    });

    it('should throw 404 when user not found in getMe', async () => {
      // Arrange
      User.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getMe('nonexistent'))
        .rejects
        .toMatchObject({
          message: 'Usuario no encontrado',
          statusCode: 404
        });
    });
  });
});
