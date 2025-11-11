import CDT from '../../src/models/cdtModel.js';

describe('CDT Model', () => {
  describe('calculateReturn', () => {
    it('should calculate return correctly for simple case', () => {
      const amount = 10000000; // 10 millones
      const rate = 12; // 12% anual
      const days = 360; // 12 meses = 360 días
      
      const expectedReturn = CDT.calculateReturn(amount, rate, days);
      
      // Fórmula: Capital * (1 + tasa/365)^días - Capital
      // Con 360 días, interés compuesto diario
      expect(expectedReturn).toBeGreaterThan(0);
      expect(expectedReturn).toBeCloseTo(1256230.59, 2);
    });

    it('should calculate return for 6 months', () => {
      const amount = 5000000;
      const rate = 10;
      const days = 180; // 6 meses = 180 días
      
      const expectedReturn = CDT.calculateReturn(amount, rate, days);
      
      expect(expectedReturn).toBeGreaterThan(0);
      expect(expectedReturn).toBeLessThan(amount * 0.1); // Menos del 10% anual
    });

    it('should calculate return for different interest rates', () => {
      const amount = 1000000;
      const days = 360; // 12 meses
      
      const return5 = CDT.calculateReturn(amount, 5, days);
      const return10 = CDT.calculateReturn(amount, 10, days);
      const return15 = CDT.calculateReturn(amount, 15, days);
      
      expect(return10).toBeGreaterThan(return5);
      expect(return15).toBeGreaterThan(return10);
    });

    it('should return formatted number with 2 decimals', () => {
      const amount = 1000000;
      const rate = 5.5;
      const days = 360;
      
      const result = CDT.calculateReturn(amount, rate, days);
      const decimals = result.toString().split('.')[1];
      
      expect(decimals?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('validateTransition', () => {
    it('should allow transition from draft to pending', () => {
      expect(CDT.validateTransition('draft', 'pending')).toBe(true);
    });

    it('should allow transition from draft to cancelled', () => {
      expect(CDT.validateTransition('draft', 'cancelled')).toBe(true);
    });

    it('should not allow transition from draft to active', () => {
      expect(CDT.validateTransition('draft', 'active')).toBe(false);
    });

    it('should allow transition from pending to active', () => {
      expect(CDT.validateTransition('pending', 'active')).toBe(true);
    });

    it('should allow transition from pending to rejected', () => {
      expect(CDT.validateTransition('pending', 'rejected')).toBe(true);
    });

    it('should not allow any transition from rejected', () => {
      expect(CDT.validateTransition('rejected', 'pending')).toBe(false);
      expect(CDT.validateTransition('rejected', 'active')).toBe(false);
    });

    it('should allow transition from active to completed', () => {
      expect(CDT.validateTransition('active', 'completed')).toBe(true);
    });

    it('should allow cancellation from most states', () => {
      expect(CDT.validateTransition('draft', 'cancelled')).toBe(true);
      expect(CDT.validateTransition('pending', 'cancelled')).toBe(true);
      expect(CDT.validateTransition('active', 'cancelled')).toBe(true);
    });

    it('should not allow transition from completed', () => {
      expect(CDT.validateTransition('completed', 'active')).toBe(false);
      expect(CDT.validateTransition('completed', 'cancelled')).toBe(false);
    });

    it('should not allow transition from cancelled', () => {
      expect(CDT.validateTransition('cancelled', 'active')).toBe(false);
      expect(CDT.validateTransition('cancelled', 'pending')).toBe(false);
    });
  });

  describe('formatCDT', () => {
    it('should format CDT object correctly', () => {
      const rawCDT = {
        id: 'test-id',
        user_id: 'user-123',
        user_name: 'Test User',
        user_email: 'test@example.com',
        amount: '10000000',
        term_months: 12,
        interest_rate: '5.5',
        start_date: '2025-01-01',
        end_date: '2026-01-01',
        estimated_return: '550000.50',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = CDT.formatCDT(rawCDT);

      expect(formatted.id).toBe('test-id');
      expect(formatted.userId).toBe('user-123');
      expect(formatted.userName).toBe('Test User');
      expect(formatted.amount).toBe(10000000);
      expect(typeof formatted.amount).toBe('number');
      expect(formatted.interestRate).toBe(5.5);
      expect(formatted.estimatedReturn).toBe(550000.50);
    });

    it('should return null for null input', () => {
      expect(CDT.formatCDT(null)).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const rawCDT = {
        id: 'test-id',
        user_id: 'user-123',
        amount: '5000000',
        term_months: 6,
        interest_rate: '8',
        start_date: '2025-01-01',
        end_date: '2025-07-01',
        estimated_return: '200000',
        status: 'draft',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const formatted = CDT.formatCDT(rawCDT);

      expect(formatted).toBeDefined();
      expect(formatted.userName).toBeUndefined();
      expect(formatted.userEmail).toBeUndefined();
    });
  });
});
