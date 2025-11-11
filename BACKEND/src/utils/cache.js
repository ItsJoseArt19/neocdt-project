/**
 * SimpleCache - Sistema de caché en memoria con TTL automático
 * 
 * Características:
 * - Almacenamiento en memoria (Map)
 * - Time-To-Live (TTL) configurable por entrada
 * - Limpieza automática de entradas expiradas
 * - Métricas de hit/miss rate
 * - Invalidación por patrón de clave
 * 
 * Uso:
 * const cache = new SimpleCache();
 * cache.set('user:123', userData, 300000); // 5 minutos
 * const data = cache.get('user:123');
 * cache.invalidatePattern('user:*'); // Invalida todos los usuarios
 */

import logger from './logger.js';

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0
    };

    // Limpieza automática cada 60 segundos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);

    logger.info('SimpleCache inicializado');
  }

  /**
   * Obtener valor del cache
   * @param {string} key - Clave del cache
   * @returns {*} Valor almacenado o null si no existe/expiró
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    // Verificar si expiró
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.metrics.misses++;
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    this.metrics.hits++;
    logger.debug(`Cache HIT: ${key}`);
    return entry.value;
  }

  /**
   * Guardar valor en cache
   * @param {string} key - Clave del cache
   * @param {*} value - Valor a almacenar
   * @param {number} ttl - Time-To-Live en milisegundos (default: 5 min)
   */
  set(key, value, ttl = 300000) {
    const expiresAt = ttl ? Date.now() + ttl : null;

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });

    this.metrics.sets++;
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Eliminar entrada específica del cache
   * @param {string} key - Clave a eliminar
   * @returns {boolean} true si se eliminó, false si no existía
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.metrics.deletes++;
      logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Invalidar todas las entradas que coincidan con un patrón
   * @param {string} pattern - Patrón de búsqueda (ej: 'user:*', 'cdt:*')
   * @returns {number} Cantidad de entradas eliminadas
   */
  invalidatePattern(pattern) {
    // SonarQube Fix: Use replaceAll() instead of replace() with /g flag
    const regex = new RegExp('^' + pattern.replaceAll('*', '.*') + '$');
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.metrics.invalidations += count;
      logger.info(`Cache INVALIDATE PATTERN: ${pattern} (${count} entradas)`);
    }

    return count;
  }

  /**
   * Limpiar cache completo
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache CLEAR: ${size} entradas eliminadas`);
  }

  /**
   * Limpiar entradas expiradas
   * @returns {number} Cantidad de entradas eliminadas
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(`Cache CLEANUP: ${count} entradas expiradas eliminadas`);
    }

    return count;
  }

  /**
   * Obtener métricas del cache
   * @returns {object} Métricas de uso del cache
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total * 100).toFixed(2) : 0;
    const missRate = total > 0 ? (this.metrics.misses / total * 100).toFixed(2) : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      invalidations: this.metrics.invalidations,
      hitRate: `${hitRate}%`,
      missRate: `${missRate}%`,
      totalRequests: total,
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Resetear métricas
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0
    };
    logger.info('Cache metrics reset');
  }

  /**
   * Detener limpieza automática (para testing/shutdown)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      logger.info('SimpleCache destroyed');
    }
  }
}

// Singleton instance
const cache = new SimpleCache();

export default cache;
