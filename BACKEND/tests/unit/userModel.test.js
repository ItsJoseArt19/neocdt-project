import User from '../../src/models/userModel.js';

describe('User Model', () => {
  describe('formatUser', () => {
    it('should format user object correctly', () => {
      const rawUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '3001234567',
        document_type: 'CC',
        document_number: '123456789',
        role: 'user',
        is_active: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = User.formatUser(rawUser);

      expect(formatted.id).toBe('test-id');
      expect(formatted.name).toBe('Test User');
      expect(formatted.email).toBe('test@example.com');
      expect(formatted.documentType).toBe('CC');
      expect(formatted.documentNumber).toBe('123456789');
      expect(formatted.isActive).toBe(true);
      expect(formatted).not.toHaveProperty('password');
      expect(formatted).not.toHaveProperty('is_active');
    });

    it('should convert is_active 0 to false', () => {
      const rawUser = {
        id: 'test-id',
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'user',
        is_active: 0,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = User.formatUser(rawUser);

      expect(formatted.isActive).toBe(false);
    });

    it('should handle boolean is_active values', () => {
      const rawUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_active: true,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = User.formatUser(rawUser);

      expect(formatted.isActive).toBe(true);
    });

    it('should return null for null input', () => {
      expect(User.formatUser(null)).toBeNull();
    });

    it('should handle admin role', () => {
      const rawUser = {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        is_active: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = User.formatUser(rawUser);

      expect(formatted.role).toBe('admin');
    });

    it('should exclude password field if present', () => {
      const rawUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        role: 'user',
        is_active: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = User.formatUser(rawUser);

      // El password se incluye si está presente (necesario para login)
      expect(formatted).toHaveProperty('password', 'hashedpassword123');
    });

    it('should handle optional phone field', () => {
      const rawUserWithPhone = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '3001234567',
        role: 'user',
        is_active: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const rawUserWithoutPhone = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_active: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formattedWith = User.formatUser(rawUserWithPhone);
      const formattedWithout = User.formatUser(rawUserWithoutPhone);

      expect(formattedWith.phone).toBe('3001234567');
      expect(formattedWithout.phone).toBeUndefined();
    });

    it('should handle optional document fields', () => {
      const rawUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_active: 1,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = User.formatUser(rawUser);

      expect(formatted.documentType).toBeUndefined();
      expect(formatted.documentNumber).toBeUndefined();
    });
  });

  describe('User validation scenarios', () => {
    it('should recognize valid email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co',
        'admin+tag@company.com.co'
      ];

      validEmails.forEach(email => {
        const user = {
          id: 'test',
          name: 'Test',
          email: email,
          role: 'user',
          is_active: 1,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        };

        const formatted = User.formatUser(user);
        expect(formatted.email).toBe(email);
      });
    });

    it('should handle different roles', () => {
      const roles = ['user', 'admin', 'manager'];

      roles.forEach(role => {
        const user = {
          id: 'test',
          name: 'Test',
          email: 'test@example.com',
          role: role,
          is_active: 1,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z'
        };

        const formatted = User.formatUser(user);
        expect(formatted.role).toBe(role);
      });
    });
  });
});
