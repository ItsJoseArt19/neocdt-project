import {
  CDT_RULES,
  validateCDTAmount,
  validateCDTTerm,
  validateInterestRate,
  getRecommendedRate,
  validateDocumentNumber,
  DOCUMENT_TYPES
} from '../../src/config/financialRules.js';

describe('financialRules validations', () => {
  describe('validateCDTAmount', () => {
    it('should fail when below minimum', () => {
      const res = validateCDTAmount(CDT_RULES.amount.min - 1);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/mínimo/i);
    });

    it('should fail when above maximum', () => {
      const res = validateCDTAmount(CDT_RULES.amount.max + 1);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/máximo/i);
    });

    it('should pass within range', () => {
      const mid = Math.floor((CDT_RULES.amount.min + CDT_RULES.amount.max) / 2);
      const res = validateCDTAmount(mid);
      expect(res.valid).toBe(true);
      expect(res.error).toBeNull();
    });
  });

  describe('validateCDTTerm', () => {
    it('should fail when below minimum days', () => {
      const res = validateCDTTerm(CDT_RULES.term.minDays - 1);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/mínimo/i);
    });

    it('should fail when above maximum days', () => {
      const res = validateCDTTerm(CDT_RULES.term.maxDays + 1);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/máximo/i);
    });

    it('should pass within range', () => {
      const mid = Math.floor((CDT_RULES.term.minDays + CDT_RULES.term.maxDays) / 2);
      const res = validateCDTTerm(mid);
      expect(res.valid).toBe(true);
      expect(res.error).toBeNull();
    });
  });

  describe('validateInterestRate', () => {
    it('should fail below minimum', () => {
      const res = validateInterestRate(CDT_RULES.interestRate.min - 0.1);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/mínima/i);
    });

    it('should fail above maximum', () => {
      const res = validateInterestRate(CDT_RULES.interestRate.max + 0.1);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/máxima/i);
    });

    it('should pass within allowed range', () => {
      const mid = (CDT_RULES.interestRate.min + CDT_RULES.interestRate.max) / 2;
      const res = validateInterestRate(mid);
      expect(res.valid).toBe(true);
      expect(res.error).toBeNull();
    });
  });

  describe('getRecommendedRate', () => {
    it('should recommend 1-3 months for <= 90 days', () => {
      expect(getRecommendedRate(60)).toBe(CDT_RULES.interestRate.typical['1-3']);
    });

    it('should recommend 4-6 months for <= 180 days', () => {
      expect(getRecommendedRate(120)).toBe(CDT_RULES.interestRate.typical['4-6']);
    });

    it('should recommend 7-12 months for <= 360 days', () => {
      expect(getRecommendedRate(300)).toBe(CDT_RULES.interestRate.typical['7-12']);
    });

    it('should recommend 13-24 months for > 360 days', () => {
      expect(getRecommendedRate(500)).toBe(CDT_RULES.interestRate.typical['13-24']);
    });
  });

  describe('validateDocumentNumber', () => {
    it('should validate CC format correctly', () => {
      const ok = validateDocumentNumber('12345678', DOCUMENT_TYPES.CC.code);
      expect(ok.valid).toBe(true);
      const bad = validateDocumentNumber('12', DOCUMENT_TYPES.CC.code);
      expect(bad.valid).toBe(false);
    });

    it('should validate CE format correctly', () => {
      const ok = validateDocumentNumber('123456', DOCUMENT_TYPES.CE.code);
      expect(ok.valid).toBe(true);
      const bad = validateDocumentNumber('1', DOCUMENT_TYPES.CE.code);
      expect(bad.valid).toBe(false);
    });
  });
});
