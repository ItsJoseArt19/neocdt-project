import User from '../models/userModel.js';
import { logger } from '../utils/logger.js';
import cache from '../utils/cache.js';

/**
 * User Service - Lógica de negocio para usuarios
 * Con caching para optimización de performance
 */

class UserService {
  /**
   * Obtener todos los usuarios (admin) - con cache
   */
  async getAllUsers(filters = {}) {
    const { page = 1, limit = 20, role, isActive } = filters;

    // Crear clave de cache única
    const cacheKey = `users:all:role:${role || 'all'}:isActive:${isActive !== undefined ? isActive : 'all'}:page:${page}:limit:${limit}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      logger.debug('Listado de usuarios obtenido del cache');
      return cachedData;
    }

    const queryFilters = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    if (role) queryFilters.role = role;
    if (isActive !== undefined) queryFilters.isActive = isActive;

    const users = await User.findAll(queryFilters);
    const total = await User.count({ role, isActive });

    const result = {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };

    // Guardar en cache (5 minutos)
    cache.set(cacheKey, result, 300000);
    logger.debug('Listado de usuarios guardado en cache');

    return result;
  }

  /**
   * Obtener usuario por ID - con cache
   */
  async getUserById(userId) {
    // Intentar obtener del cache
    const cacheKey = `user:${userId}`;
    const cachedUser = cache.get(cacheKey);

    if (cachedUser) {
      logger.debug(`Usuario ${userId} obtenido del cache`);
      return cachedUser;
    }

    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Remover datos sensibles
    delete user.password;
    delete user.refreshToken;

    // Guardar en cache (5 minutos)
    cache.set(cacheKey, user, 300000);
    logger.debug(`Usuario ${userId} guardado en cache`);

    return user;
  }

  /**
   * Actualizar usuario (admin)
   */
  async updateUser(userId, updateData) {
    const { name, email, role, isActive } = updateData;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.is_active = isActive ? 1 : 0;

    const user = await User.update(userId, updates);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Remover datos sensibles
    delete user.password;
    delete user.refreshToken;

    // Invalidar cache del usuario y listados
    cache.delete(`user:${userId}`);
    cache.invalidatePattern(`users:all:*`);
    logger.info(`Cache invalidado para usuario ${userId} en updateUser`);

    return user;
  }

  /**
   * Eliminar usuario (admin)
   */
  async deleteUser(userId) {
    const deleted = await User.deleteById(userId);

    if (!deleted) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Invalidar cache del usuario y listados
    cache.delete(`user:${userId}`);
    cache.invalidatePattern(`users:all:*`);
    cache.invalidatePattern(`cdts:user:${userId}:*`); // También CDTs del usuario
    logger.info(`Cache invalidado para usuario ${userId} en deleteUser`);

    return true;
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getMe(userId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Remover datos sensibles
    delete user.password;
    delete user.refreshToken;

    return user;
  }

  /**
   * Actualizar perfil del usuario actual
   */
  async updateMe(userId, updateData) {
    const { name, email } = updateData;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      // Verificar si el email ya está en uso
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        const error = new Error('El correo electrónico ya está en uso');
        error.statusCode = 400;
        throw error;
      }
      updates.email = email;
    }

    const user = await User.update(userId, updates);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Remover datos sensibles
    delete user.password;
    delete user.refreshToken;

    // Invalidar cache del usuario
    cache.delete(`user:${userId}`);
    logger.info(`Cache invalidado para usuario ${userId} en updateMe`);

    return user;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, userEmail, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    // Obtener usuario con contraseña
    const user = await User.findByEmail(userEmail, true);

    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Verificar contraseña actual
    const isValid = await User.comparePassword(currentPassword, user.password);
    if (!isValid) {
      const error = new Error('La contraseña actual es incorrecta');
      error.statusCode = 401;
      throw error;
    }

    // Actualizar contraseña
    await User.updatePassword(userId, newPassword);

    return true;
  }
}

export default new UserService();
