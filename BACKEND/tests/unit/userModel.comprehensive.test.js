import { jest } from '@jest/globals';
import Database from 'better-sqlite3';

const mockDb = {
  prepare: jest.fn(),
  close: jest.fn(),
  exec: jest.fn()
};

const mockStmt = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
};

// Mock de bcrypt
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn()
};

jest.unstable_mockModule('better-sqlite3', () => ({
  __esModule: true,
  default: jest.fn(() => mockDb)
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt,
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt,
  hash: mockBcrypt.hash,
  compare: mockBcrypt.compare
}));

jest.unstable_mockModule('../../src/config/database.js', () => ({
  getDB: jest.fn(() => mockDb),
  connectDB: jest.fn(),
  closeDB: jest.fn()
}));

const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

const noop = jest.fn();

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: mockLogger,
  logDatabase: noop
}));

const userModel = (await import('../../src/models/userModel.js')).default;
const { getDB } = await import('../../src/config/database.js');
const bcrypt = await import('bcryptjs');

describe('userModel - complete coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDB.mockReturnValue(mockDb);
    mockDb.prepare.mockReturnValue(mockStmt);
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'neo@matrix.com',
        name: 'Neo',
        is_active: 1,
        role: 'user'
      };
      mockStmt.get.mockReturnValueOnce(mockUser);

      const result = await userModel.findByEmail('neo@matrix.com');

      expect(result).toEqual(expect.objectContaining({
        email: 'neo@matrix.com',
        isActive: true
      }));
    });

    it('should return null when user not found', async () => {
      mockStmt.get.mockReturnValueOnce(null);

      const result = await userModel.findByEmail('missing@neo.com');

      expect(result).toBeNull();
    });

    it('should include password when requested', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'neo@matrix.com',
        password: 'hashed',
        is_active: 1
      };
      mockStmt.get.mockReturnValueOnce(mockUser);

      const result = await userModel.findByEmail('neo@matrix.com', true);

      expect(result).toHaveProperty('password');
    });
  });

  describe('findByDocument', () => {
    it('should find user by document', async () => {
      const mockUser = {
        id: 'user-1',
        document_type: 'CC',
        document_number: '123456',
        is_active: 1
      };
      mockStmt.get.mockReturnValueOnce(mockUser);

      const result = await userModel.findByDocument('CC', '123456');

      expect(result).toEqual(expect.objectContaining({
        documentType: 'CC',
        documentNumber: '123456'
      }));
    });

    it('should return null when document not found', async () => {
      mockStmt.get.mockReturnValueOnce(null);

      const result = await userModel.findByDocument('CC', '999999');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'neo@matrix.com',
        is_active: 1
      };
      mockStmt.get.mockReturnValueOnce(mockUser);

      const result = await userModel.findById('user-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'user-1',
        email: 'neo@matrix.com'
      }));
    });

    it('should return null when id not found', async () => {
      mockStmt.get.mockReturnValueOnce(null);

      const result = await userModel.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const userData = {
        name: 'Neo',
        email: 'neo@matrix.com',
        password: 'password123',
        documentType: 'CC',
        documentNumber: '123456'
      };

      mockBcrypt.hash.mockResolvedValueOnce('hashed-password');
      mockStmt.run.mockReturnValueOnce({ changes: 1 });
      mockStmt.get.mockReturnValueOnce({
        id: 'new-user-id',
        name: userData.name,
        email: userData.email,
        is_active: 1,
        role: 'user',
        created_at: new Date().toISOString()
      });

      const result = await userModel.create(userData);

      expect(result).toEqual(expect.objectContaining({
        email: 'neo@matrix.com'
      }));
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should handle optional fields in create', async () => {
      const userData = {
        name: 'Neo',
        email: 'neo@matrix.com',
        password: 'password123',
        documentType: 'CC',
        documentNumber: '123456',
        phone: '1234567890',
        nationality: 'Colombian',
        residenceDate: '2020-01-01'
      };

      mockBcrypt.hash.mockResolvedValueOnce('hashed-password');
      mockStmt.run.mockReturnValueOnce({ changes: 1 });
      mockStmt.get.mockReturnValueOnce({
        id: 'new-user-id',
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        nationality: userData.nationality,
        is_active: 1,
        role: 'user'
      });

      const result = await userModel.create(userData);

      expect(result).toEqual(expect.objectContaining({
        phone: '1234567890'
      }));
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updates = { name: 'Updated Neo', phone: '9876543210' };
      mockStmt.run.mockReturnValueOnce({ changes: 1 });
      mockStmt.get.mockReturnValueOnce({
        id: 'user-1',
        name: 'Updated Neo',
        phone: '9876543210',
        is_active: 1
      });

      const result = await userModel.update('user-1', updates);

      expect(result.name).toBe('Updated Neo');
      expect(result.phone).toBe('9876543210');
    });

    it('should return null when user not found for update', async () => {
      mockStmt.run.mockReturnValueOnce({ changes: 0 });

      const result = await userModel.update('missing-id', { name: 'New Name' });

      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete user by id', async () => {
      mockStmt.run.mockReturnValueOnce({ changes: 1 });

      const result = await userModel.deleteById('user-1');

      expect(result).toBe(true);
    });

    it('should return false when user not found for deletion', async () => {
      mockStmt.run.mockReturnValueOnce({ changes: 0 });

      const result = await userModel.deleteById('missing-id');

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@neo.com', is_active: 1 },
        { id: 'user-2', email: 'user2@neo.com', is_active: 1 }
      ];
      mockStmt.all.mockReturnValueOnce(mockUsers);

      const result = await userModel.findAll({ limit: 10, offset: 0 });

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@neo.com');
    });

    it('should filter by role', async () => {
      mockStmt.all.mockReturnValueOnce([
        { id: 'admin-1', role: 'admin', is_active: 1 }
      ]);

      const result = await userModel.findAll({ role: 'admin' });

      expect(result[0].role).toBe('admin');
    });

    it('should filter by isActive status', async () => {
      mockStmt.all.mockReturnValueOnce([
        { id: 'user-1', is_active: 0 }
      ]);

      const result = await userModel.findAll({ isActive: false });

      expect(result[0].isActive).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all users', async () => {
      mockStmt.get.mockReturnValueOnce({ count: 50 });

      const result = await userModel.count();

      expect(result).toBe(50);
    });

    it('should count users by role', async () => {
      mockStmt.get.mockReturnValueOnce({ count: 5 });

      const result = await userModel.count({ role: 'admin' });

      expect(result).toBe(5);
    });

    it('should count active users', async () => {
      mockStmt.get.mockReturnValueOnce({ count: 40 });

      const result = await userModel.count({ isActive: true });

      expect(result).toBe(40);
    });
  });

  describe('count', () => {
    it('should count all users', async () => {
      mockStmt.get.mockReturnValueOnce({ count: 50 });

      const result = await userModel.count();

      expect(result).toBe(50);
    });

    it('should count users by role', async () => {
      mockStmt.get.mockReturnValueOnce({ count: 5 });

      const result = await userModel.count({ role: 'admin' });

      expect(result).toBe(5);
    });

    it('should count active users', async () => {
      mockStmt.get.mockReturnValueOnce({ count: 40 });

      const result = await userModel.count({ isActive: true });

      expect(result).toBe(40);
    });
  });

  describe('formatUser', () => {
    it('should format user object correctly', () => {
      const rawUser = {
        id: 'user-1',
        email: 'neo@matrix.com',
        name: 'Neo',
        document_type: 'CC',
        document_number: '123456',
        phone: '1234567890',
        is_active: 1,
        role: 'user',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-02T00:00:00.000Z'
      };

      const result = userModel.formatUser(rawUser);

      expect(result).toEqual(expect.objectContaining({
        id: 'user-1',
        email: 'neo@matrix.com',
        documentType: 'CC',
        documentNumber: '123456',
        isActive: true
      }));
      expect(result).not.toHaveProperty('is_active');
      expect(result).not.toHaveProperty('document_type');
    });

    it('should exclude password from formatted user', () => {
      const rawUser = {
        id: 'user-1',
        email: 'neo@matrix.com',
        is_active: 1
      };

      const result = userModel.formatUser(rawUser);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 'user-1');
    });

    it('should return null for null input', () => {
      const result = userModel.formatUser(null);

      expect(result).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const rawUser = {
        id: 'user-1',
        email: 'neo@matrix.com',
        is_active: 1
      };

      const result = userModel.formatUser(rawUser);

      expect(result.phone).toBeUndefined();
      expect(result.nationality).toBeUndefined();
    });
  });
});
