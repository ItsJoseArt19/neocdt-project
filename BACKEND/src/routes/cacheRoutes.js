import express from 'express';
import { getCacheMetrics, clearCache, invalidateCachePattern, resetCacheMetrics } from '../controllers/cacheController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import csrfProtection from '../middlewares/csrfProtection.js';

const router = express.Router();

/**
 * @route   GET /api/v1/cache/metrics
 * @desc    Obtener métricas del cache (hit rate, miss rate, tamaño)
 * @access  Private (requiere autenticación)
 */
router.get('/metrics', protect, getCacheMetrics);

/**
 * @route   POST /api/v1/cache/clear
 * @desc    Limpiar cache completo
 * @access  Private/Admin
 */
router.post('/clear', protect, restrictTo('admin'), csrfProtection, clearCache);

/**
 * @route   POST /api/v1/cache/invalidate
 * @desc    Invalidar entradas de cache por patrón
 * @access  Private/Admin
 */
router.post('/invalidate', protect, restrictTo('admin'), csrfProtection, invalidateCachePattern);

/**
 * @route   POST /api/v1/cache/metrics/reset
 * @desc    Resetear métricas de cache
 * @access  Private/Admin
 */
router.post('/metrics/reset', protect, restrictTo('admin'), csrfProtection, resetCacheMetrics);

export default router;
