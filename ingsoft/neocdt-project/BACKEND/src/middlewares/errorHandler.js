import { logger } from '../utils/logger.js';

/**
 * Middleware central de manejo de errores
 * Captura todos los errores de la aplicación y los transforma en respuestas HTTP
 * @param {Error} err - Error capturado
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 * @returns {Object} JSON con el error formateado
 */
export const errorHandler = (err, req, res, next) => {
  const error = { ...err };
  error.message = err.message;

  // Log detallado del error
  logger.error('Error capturado por errorHandler', {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // SQLite constraint error (UNIQUE constraint failed)
  if (err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('UNIQUE constraint failed')) {
    const message = 'Valor de campo duplicado ingresado';
    error.message = message;
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token inválido';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expirado';
    error.statusCode = 401;
  }

  // CSRF token errors
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token inválido o ausente', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    error.message = 'Token CSRF inválido o ausente';
    error.statusCode = 403;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = 'Error de validación';
    error.message = message;
    error.statusCode = 400;
  }

  const statusCode = error.statusCode || 500;
  const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

  res.status(statusCode).json({
    status,
    message: error.message || 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};