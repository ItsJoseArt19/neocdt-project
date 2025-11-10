import cache from '../utils/cache.js';
import { logger } from '../utils/logger.js';

/**
 * Obtener métricas del cache
 */
export const getCacheMetrics = async (req, res, next) => {
  try {
    const metrics = cache.getMetrics();
    
    logger.info('Métricas de cache consultadas', {
      userId: req.user?.id,
      metrics
    });

    res.status(200).json({
      status: 'success',
      data: {
        metrics,
        message: 'Métricas del sistema de cache'
      }
    });
  } catch (error) {
    logger.error('Error al obtener métricas de cache', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Limpiar cache completo (admin only)
 */
export const clearCache = async (req, res, next) => {
  try {
    cache.clear();
    
    logger.info('Cache limpiado manualmente', {
      userId: req.user?.id,
      userRole: req.user?.role
    });

    res.status(200).json({
      status: 'success',
      message: 'Cache limpiado exitosamente'
    });
  } catch (error) {
    logger.error('Error al limpiar cache', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Invalidar patrón específico de cache (admin only)
 */
export const invalidateCachePattern = async (req, res, next) => {
  try {
    const { pattern } = req.body;

    if (!pattern) {
      return res.status(400).json({
        status: 'fail',
        message: 'Se requiere un patrón para invalidar'
      });
    }

    const count = cache.invalidatePattern(pattern);

    logger.info('Patrón de cache invalidado', {
      userId: req.user?.id,
      pattern,
      entriesInvalidated: count
    });

    res.status(200).json({
      status: 'success',
      message: `${count} entradas de cache invalidadas`,
      data: { pattern, count }
    });
  } catch (error) {
    logger.error('Error al invalidar patrón de cache', {
      error: error.message,
      pattern: req.body?.pattern,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Resetear métricas de cache (admin only)
 */
export const resetCacheMetrics = async (req, res, next) => {
  try {
    cache.resetMetrics();

    logger.info('Métricas de cache reseteadas', {
      userId: req.user?.id
    });

    res.status(200).json({
      status: 'success',
      message: 'Métricas de cache reseteadas exitosamente'
    });
  } catch (error) {
    logger.error('Error al resetear métricas de cache', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};
