import { jest } from '@jest/globals';
import cache from '../../src/utils/cache.js';

// Silenciar logger en pruebas para evitar ruido
jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
}));

describe('SimpleCache', () => {
  afterEach(() => {
    cache.clear();
    cache.resetMetrics();
  });

  afterAll(() => {
    // Restaurar módulos (por si otros tests necesitan logger real)
    jest.resetModules();
    cache.destroy();
  });

  it('should set and get values with hits/misses', () => {
    expect(cache.get('k1')).toBeNull();
    cache.set('k1', 'v1', 1000);
    expect(cache.get('k1')).toBe('v1');
    const metrics = cache.getMetrics();
    expect(Number(metrics.hits)).toBeGreaterThan(0);
    expect(Number(metrics.misses)).toBeGreaterThanOrEqual(1);
  });

  it('should expire values after TTL', async () => {
    cache.set('k2', 'v2', 20);
    await new Promise(r => setTimeout(r, 30));
    expect(cache.get('k2')).toBeNull();
  });

  it('should delete a value and return boolean', () => {
    cache.set('k3', 'v3', 1000);
    expect(cache.delete('k3')).toBe(true);
    expect(cache.delete('k3')).toBe(false);
  });

  it('should invalidate by pattern', () => {
    cache.set('user:1', 1);
    cache.set('user:2', 2);
    cache.set('cdt:1', 99);
    const removed = cache.invalidatePattern('user:*');
    expect(removed).toBe(2);
    expect(cache.get('cdt:1')).toBe(99);
  });

  it('should compute metrics and reset them', () => {
    cache.set('m', 1);
    cache.get('m');
    let metrics = cache.getMetrics();
    expect(metrics.cacheSize).toBeGreaterThan(0);
    cache.resetMetrics();
    metrics = cache.getMetrics();
    expect(metrics.hits).toBe(0);
    expect(metrics.misses).toBe(0);
  });
});
