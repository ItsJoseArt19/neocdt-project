import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { connectDB, closeDB, getDB } from '../../src/config/database.js';
import CDT from '../../src/models/cdtModel.js';
import User from '../../src/models/userModel.js';
import { v4 as uuidv4 } from 'uuid';

describe('CDT Model - Additional Coverage', () => {
  let testUserId;
  let db;

  beforeAll(async () => {
    await connectDB();
    db = getDB();
    
    // Create test user with unique document
    const uniqueDoc = `${Date.now()}`.slice(-10); // Últimos 10 dígitos del timestamp
    const user = await User.create({
      name: 'Test User',
      email: `test-${uuidv4()}@example.com`,
      password: 'Password123!',
      documentType: 'CC',
      documentNumber: uniqueDoc
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      const cdts = CDT.findByUserId(testUserId);
      for (const cdt of cdts) {
        CDT.deleteById(cdt.id);
      }
      await User.deleteById(testUserId);
    }
    await closeDB();
  });

  beforeEach(() => {
    // Clean up CDTs before each test
    db.prepare('DELETE FROM cdt_audit_logs WHERE cdt_id IN (SELECT id FROM cdts WHERE user_id = ?)').run(testUserId);
    db.prepare('DELETE FROM cdts WHERE user_id = ?').run(testUserId);
  });

  describe('findByUserId with filters', () => {
    it('should find CDTs with limit filter', async () => {
      // Create multiple CDTs
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });
      CDT.create({
        userId: testUserId,
        amount: 2000000,
        termDays: 180,
        interestRate: 6.0,
        startDate: '2025-01-01',
        endDate: '2025-07-01'
      });

      const cdts = CDT.findByUserId(testUserId, { limit: 1 });
      
      expect(cdts).toHaveLength(1);
    });

    it('should find CDTs with offset filter', async () => {
      // Create multiple CDTs
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });
      CDT.create({
        userId: testUserId,
        amount: 2000000,
        termDays: 180,
        interestRate: 6.0,
        startDate: '2025-01-01',
        endDate: '2025-07-01'
      });

      const cdts = CDT.findByUserId(testUserId, { offset: 1, limit: 10 });
      
      expect(cdts).toHaveLength(1);
    });

    it('should filter CDTs by status', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01',
        status: 'draft'
      });
      CDT.create({
        userId: testUserId,
        amount: 2000000,
        termDays: 180,
        interestRate: 6.0,
        startDate: '2025-01-01',
        endDate: '2025-07-01',
        status: 'active'
      });

      const draftCdts = CDT.findByUserId(testUserId, { status: 'draft' });
      const activeCdts = CDT.findByUserId(testUserId, { status: 'active' });
      
      expect(draftCdts).toHaveLength(1);
      expect(activeCdts).toHaveLength(1);
      expect(draftCdts[0].status).toBe('draft');
      expect(activeCdts[0].status).toBe('active');
    });
  });

  describe('findAll with filters', () => {
    it('should find all CDTs without filters', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      const cdts = CDT.findAll();
      
      expect(Array.isArray(cdts)).toBe(true);
      expect(cdts.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01',
        status: 'pending'
      });

      const pendingCdts = CDT.findAll({ status: 'pending' });
      
      expect(pendingCdts.length).toBeGreaterThanOrEqual(1);
      expect(pendingCdts.every(cdt => cdt.status === 'pending')).toBe(true);
    });

    it('should filter by userId', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      const userCdts = CDT.findAll({ userId: testUserId });
      
      expect(userCdts.length).toBeGreaterThanOrEqual(1);
      expect(userCdts.every(cdt => cdt.userId === testUserId)).toBe(true);
    });

    it('should apply limit filter', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });
      CDT.create({
        userId: testUserId,
        amount: 2000000,
        termDays: 180,
        interestRate: 6.0,
        startDate: '2025-01-01',
        endDate: '2025-07-01'
      });

      const cdts = CDT.findAll({ limit: 1 });
      
      expect(cdts).toHaveLength(1);
    });
  });

  describe('update method', () => {
    it('should update CDT fields successfully', async () => {
      const cdt = CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      const updated = CDT.update(cdt.id, {
        amount: 1500000,
        term_days: 120,
        interest_rate: 6.0
      });

      expect(updated).not.toBeNull();
      expect(updated.amount).toBe(1500000);
      expect(updated.termDays).toBe(120);
      expect(updated.interestRate).toBe(6.0);
    });

    it('should return null when updating non-existent CDT', async () => {
      const fakeId = uuidv4();
      
  const result = CDT.update(fakeId, { amount: 2000000 });
      
      expect(result).toBeNull();
    });
  });

  describe('updateStatus method', () => {
    it('should update status successfully', async () => {
      const cdt = CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01',
        status: 'draft'
      });

      const updated = CDT.updateStatus(cdt.id, 'pending');
      
      // updateStatus devuelve true/false, no el objeto
      expect(updated).toBe(true);
      
      // Verificar que el status cambió
  const updatedCDT = CDT.findById(cdt.id);
      expect(updatedCDT.status).toBe('pending');
    });

    it('should return false for invalid CDT ID', async () => {
      const fakeId = uuidv4();
      
  const result = CDT.updateStatus(fakeId, 'active');
      
      // updateStatus devuelve false cuando no hay cambios
      expect(result).toBe(false);
    });
  });

  describe('cancel method', () => {
    it('should cancel CDT with reason', async () => {
      const cdt = CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01',
        status: 'pending' // Cancel solo funciona con pending o active
      });

      const cancelled = CDT.cancel(cdt.id, testUserId, 'user', 'User requested cancellation');
      
      expect(cancelled).not.toBeNull();
      expect(cancelled.status).toBe('cancelled');
    });
  });

  describe('deleteById method', () => {
    it('should delete CDT successfully', async () => {
      const cdt = CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      const result = CDT.deleteById(cdt.id);
      
      expect(result).toBe(true);
      
  const found = CDT.findById(cdt.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent CDT', async () => {
      const fakeId = uuidv4();
      
  const result = CDT.deleteById(fakeId);
      
      expect(result).toBe(false);
    });
  });

  describe('findByStatus method', () => {
    it('should find all pending CDTs', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01',
        status: 'pending'
      });

      const pendingCdts = CDT.findByStatus('pending');
      
      expect(Array.isArray(pendingCdts)).toBe(true);
      expect(pendingCdts.length).toBeGreaterThanOrEqual(1);
      expect(pendingCdts.every(cdt => cdt.status === 'pending')).toBe(true);
    });

    it('should filter by userId', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01',
        status: 'active'
      });

      const userCdts = CDT.findByStatus('active', testUserId);
      
      expect(Array.isArray(userCdts)).toBe(true);
      expect(userCdts.every(cdt => cdt.userId === testUserId)).toBe(true);
    });
  });

  describe('count method', () => {
    it('should count all CDTs', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      const count = CDT.count();
      
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should count CDTs by status', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01',
        status: 'draft'
      });

      const draftCount = CDT.count({ status: 'draft' });
      
      expect(typeof draftCount).toBe('number');
      expect(draftCount).toBeGreaterThanOrEqual(1);
    });

    it('should count CDTs by userId', async () => {
      CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      const userCount = CDT.count({ userId: testUserId });
      
      expect(typeof userCount).toBe('number');
      expect(userCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('createAuditLog method', () => {
    it('should add audit log entry', async () => {
      const cdt = CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      CDT.createAuditLog(cdt.id, 'test_action', 'Test details');
      
      const logs = CDT.getAuditLogs(cdt.id);
      
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const testLog = logs.find(log => log.action === 'test_action');
      expect(testLog).toBeDefined();
      expect(testLog.details).toBe('Test details');
    });
  });

  describe('getAuditLogs method', () => {
    it('should retrieve audit log for CDT', async () => {
      const cdt = CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      CDT.createAuditLog(cdt.id, 'create', 'CDT created');
      CDT.createAuditLog(cdt.id, 'update', 'CDT updated');

      const logs = CDT.getAuditLogs(cdt.id);
      
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThanOrEqual(2);
      // La columna en BD es cdt_id (snake_case), no cdtId
      expect(logs.every(log => log.cdt_id === cdt.id)).toBe(true);
    });

    it('should return empty array for CDT with no logs', async () => {
      const cdt = CDT.create({
        userId: testUserId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.0,
        startDate: '2025-01-01',
        endDate: '2025-04-01'
      });

      // Clear audit logs
      db.prepare('DELETE FROM cdt_audit_logs WHERE cdt_id = ?').run(cdt.id);

  const logs = CDT.getAuditLogs(cdt.id);
      
      expect(Array.isArray(logs)).toBe(true);
      expect(logs).toHaveLength(0);
    });
  });

  describe('validateTransition - edge cases', () => {
    it('should reject transition from active to draft', () => {
      const result = CDT.validateTransition('active', 'draft');
      expect(result).toBe(false);
    });

    it('should reject transition from completed to active', () => {
      const result = CDT.validateTransition('completed', 'active');
      expect(result).toBe(false);
    });

    it('should reject transition from cancelled to pending', () => {
      const result = CDT.validateTransition('cancelled', 'pending');
      expect(result).toBe(false);
    });

    it('should reject transition from rejected to active', () => {
      const result = CDT.validateTransition('rejected', 'active');
      expect(result).toBe(false);
    });

    it('should allow transition from draft to cancelled', () => {
      const result = CDT.validateTransition('draft', 'cancelled');
      expect(result).toBe(true);
    });

    it('should allow transition from pending to cancelled', () => {
      const result = CDT.validateTransition('pending', 'cancelled');
      expect(result).toBe(true);
    });

    it('should allow transition from active to cancelled', () => {
      const result = CDT.validateTransition('active', 'cancelled');
      expect(result).toBe(true);
    });

    it('should allow transition from active to completed', () => {
      const result = CDT.validateTransition('active', 'completed');
      expect(result).toBe(true);
    });
  });
});
