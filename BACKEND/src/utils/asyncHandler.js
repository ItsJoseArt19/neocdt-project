import { logger } from './logger.js';

/**
 * Wrapper para handlers asíncronos con logging automático de errores
 * Elimina la necesidad de try-catch repetitivo en controladores
 * 
 * @param {Function} fn - Función async del controlador
 * @param {string} handlerName - Nombre del handler para logging
 * @param {string} action - Acción para auditoría
 * @returns {Function} Middleware de Express
 * 
 * @example
 * export const createUser = asyncHandler(async (req, res) => {
 *   const user = await userService.create(req.body);
 *   res.status(201).json({ status: 'success', data: { user } });
 * }, 'createUser', 'user-creation');
 */
export const asyncHandler = (fn, handlerName, action) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      // Log detallado del error con contexto completo
      logger.error(`Error en ${handlerName}`, {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        userRole: req.user?.role,
        action,
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        // Redactar campos sensibles
        body: action?.includes('password') || action?.includes('login') 
          ? '[REDACTED]' 
          : req.body,
        ip: req.ip,
        userAgent: req.get ? req.get('user-agent') : undefined,
        timestamp: new Date().toISOString()
      });
      
      // Si el error tiene statusCode, responder directamente
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: 'fail',
          message: error.message
        });
      }
      
      // Pasar al error handler middleware
      next(error);
    }
  };
};

/**
 * Helper para respuestas exitosas estandarizadas
 * @param {Object} res - Objeto response de Express
 * @param {*} data - Datos a retornar
 * @param {number} statusCode - Código HTTP (default: 200)
 * @param {Object} meta - Metadata adicional (pagination, etc)
 */
export const sendSuccess = (res, data, statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
    ...meta
  });
};

/**
 * Helper para respuesta de creación
 */
export const sendCreated = (res, data, meta = {}) => {
  return sendSuccess(res, data, 201, meta);
};

/**
 * Helper para respuestas de error
 */
export const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = {
    status: 'fail',
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

export default asyncHandler;
