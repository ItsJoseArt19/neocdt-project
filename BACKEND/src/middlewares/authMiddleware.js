import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Middleware de protección de rutas mediante JWT
 * Verifica que el usuario esté autenticado y el token sea válido
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Función next de Express
 * @returns {Object} JSON con error 401 si no está autenticado
 */
export const protect = async (req, res, next) => {
  try {
    // Obtener token del header (usando optional chaining)
    const token = req.headers?.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'No autorizado para acceder a esta ruta'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Buscar usuario
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'El usuario ya no existe o está inactivo'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Error en autenticación', { error: error.message });
    return res.status(401).json({
      status: 'fail',
      message: 'Token inválido o expirado'
    });
  }
};

/**
 * Middleware de autorización basado en roles
 * Restringe el acceso a rutas según el rol del usuario
 * @param {...string} roles - Roles permitidos para acceder a la ruta
 * @returns {Function} Middleware que verifica el rol del usuario
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Usar optional chaining para verificar role
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permiso para realizar esta acción'
      });
    }
    next();
  };
};