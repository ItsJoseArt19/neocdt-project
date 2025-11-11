import { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken } from '../../src/utils/jwt.js';
import jwt from 'jsonwebtoken';

describe('JWT Utils', () => {
  const userId = 'test-user-id-123';

  describe('generateToken', () => {
    it('should generate a valid access token', () => {
      const token = generateToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBeDefined();
    });

    it('should include expiration in token', () => {
      const token = generateToken(userId);
      const decoded = jwt.decode(token);
      
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(userId);
    });

    it('should have longer expiration than access token', () => {
      const accessToken = generateToken(userId);
      const refreshToken = generateRefreshToken(userId);
      
      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);
      
      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = generateToken(userId);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      
      expect(() => verifyToken(expiredToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });
});
