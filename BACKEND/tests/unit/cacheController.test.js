import { jest } from '@jest/globals';

const mockCache = {
  getMetrics: jest.fn(),
  clear: jest.fn(),
  invalidatePattern: jest.fn(),
  resetMetrics: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
};

jest.unstable_mockModule('../../src/utils/cache.js', () => ({
  __esModule: true,
  default: mockCache
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger
}));

let getCacheMetrics;
let clearCache;
let invalidateCachePattern;
let resetCacheMetrics;

beforeAll(async () => {
  const controller = await import('../../src/controllers/cacheController.js');
  getCacheMetrics = controller.getCacheMetrics;
  clearCache = controller.clearCache;
  invalidateCachePattern = controller.invalidateCachePattern;
  resetCacheMetrics = controller.resetCacheMetrics;
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('cacheController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseReq = { user: { id: 'admin-id', role: 'admin' } };

  describe('getCacheMetrics', () => {
    it('should return cache metrics successfully', async () => {
      const metrics = { hits: 10, misses: 2 };
      mockCache.getMetrics.mockReturnValueOnce(metrics);
      const req = { ...baseReq };
      const res = createMockResponse();
      const next = jest.fn();

      await getCacheMetrics(req, res, next);

      expect(mockCache.getMetrics).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({ metrics })
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass errors to next handler', async () => {
      const error = new Error('Cache failure');
      mockCache.getMetrics.mockImplementationOnce(() => { throw error; });
      const res = createMockResponse();
      const next = jest.fn();

      await getCacheMetrics(baseReq, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('clearCache', () => {
    it('should clear cache and respond 200', async () => {
      const res = createMockResponse();
      const next = jest.fn();

      await clearCache(baseReq, res, next);

      expect(mockCache.clear).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward errors when clear fails', async () => {
      const res = createMockResponse();
      const next = jest.fn();
      const error = new Error('clear failed');
      mockCache.clear.mockImplementationOnce(() => { throw error; });

      await clearCache(baseReq, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('invalidateCachePattern', () => {
    it('should return 400 when pattern missing', async () => {
      const req = { ...baseReq, body: {} };
      const res = createMockResponse();
      const next = jest.fn();

      await invalidateCachePattern(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should invalidate cache pattern and return success', async () => {
      mockCache.invalidatePattern.mockReturnValueOnce(3);
      const req = { ...baseReq, body: { pattern: 'user:*' } };
      const res = createMockResponse();
      const next = jest.fn();

      await invalidateCachePattern(req, res, next);

      expect(mockCache.invalidatePattern).toHaveBeenCalledWith('user:*');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({ pattern: 'user:*', count: 3 })
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward errors when invalidation fails', async () => {
      const error = new Error('invalidate failed');
      mockCache.invalidatePattern.mockImplementationOnce(() => { throw error; });
      const req = { ...baseReq, body: { pattern: 'cdts:*' } };
      const res = createMockResponse();
      const next = jest.fn();

      await invalidateCachePattern(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('resetCacheMetrics', () => {
    it('should reset metrics and return success', async () => {
      const res = createMockResponse();
      const next = jest.fn();

      await resetCacheMetrics(baseReq, res, next);

      expect(mockCache.resetMetrics).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should forward errors when reset fails', async () => {
      const error = new Error('reset failed');
      mockCache.resetMetrics.mockImplementationOnce(() => { throw error; });
      const res = createMockResponse();
      const next = jest.fn();

      await resetCacheMetrics(baseReq, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
