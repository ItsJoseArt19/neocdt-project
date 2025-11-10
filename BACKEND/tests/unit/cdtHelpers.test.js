import {
  calculateEndDate,
  hasAccessPermission,
  canModifyCDT,
  isEditable,
  isDeletable,
  formatPaginationFilters,
  createPaginatedResponse,
  validateCDTUpdates
} from '../../src/controllers/helpers/cdtHelpers.js';

describe('cdtHelpers', () => {
  it('calculateEndDate should add months correctly', () => {
    const start = '2025-01-15';
    const end = calculateEndDate(start, 6);
    expect(end).toMatch(/^2025-07-\d{2}$/);
  });

  it('hasAccessPermission should allow owner or admin', () => {
    const cdt = { userId: 'u1' };
    expect(hasAccessPermission(cdt, { id: 'u1', role: 'user' })).toBe(true);
    expect(hasAccessPermission(cdt, { id: 'u2', role: 'admin' })).toBe(true);
    expect(hasAccessPermission(cdt, { id: 'u2', role: 'user' })).toBe(false);
  });

  it('canModifyCDT mirrors access rules (owner/admin)', () => {
    const cdt = { userId: 'owner' };
    expect(canModifyCDT(cdt, { id: 'owner', role: 'user' })).toBe(true);
    expect(canModifyCDT(cdt, { id: 'other', role: 'admin' })).toBe(true);
    expect(canModifyCDT(cdt, { id: 'other', role: 'user' })).toBe(false);
  });

  it('isEditable only draft or pending', () => {
    expect(isEditable('draft')).toBe(true);
    expect(isEditable('pending')).toBe(true);
    expect(isEditable('active')).toBe(false);
  });

  it('isDeletable only draft or cancelled', () => {
    expect(isDeletable('draft')).toBe(true);
    expect(isDeletable('cancelled')).toBe(true);
    expect(isDeletable('active')).toBe(false);
  });

  it('formatPaginationFilters should build filters and metadata', () => {
    const { filters, page, limit } = formatPaginationFilters({ page: '2', limit: '10', status: 'active', userId: 'u1' });
    expect(page).toBe(2);
    expect(limit).toBe(10);
    expect(filters).toMatchObject({ limit: 10, offset: 10, status: 'active', userId: 'u1' });
  });

  it('createPaginatedResponse builds standard response', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const resp = createPaginatedResponse(data, 50, 2, 10);
    expect(resp.status).toBe('success');
    expect(resp.results).toBe(2);
    expect(resp.totalPages).toBe(5);
    expect(resp.data).toBe(data);
  });

  it('validateCDTUpdates enforces allowed fields and non-empty', () => {
    const none = validateCDTUpdates({});
    expect(none.valid).toBe(false);
    expect(none.errors.join(' ')).toMatch(/al menos un campo/i);

    const invalid = validateCDTUpdates({ unknown: 1 });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join(' ')).toMatch(/no puede ser actualizado/i);

    const ok = validateCDTUpdates({ amount: 100 });
    expect(ok.valid).toBe(true);
    expect(ok.errors.length).toBe(0);
  });
});
