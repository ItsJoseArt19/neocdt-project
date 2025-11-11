import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import cache from '../utils/cache.js';

/**
 * Auth Service - Lógica de negocio para autenticación
 * Gestiona el ciclo completo de autenticación con JWT y refresh tokens
 * Implementa caching para optimización de performance
 */

class AuthService {
  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} userData - Datos del usuario a registrar
   * @param {string} userData.name - Nombre completo del usuario
   * @param {string} userData.email - Email único del usuario
   * @param {string} userData.password - Contraseña en texto plano (se hasheará)
   * @param {string} userData.documentType - Tipo de documento (CC, CE)
   * @param {string} userData.documentNumber - Número de documento único
   * @param {string} [userData.phone] - Teléfono del usuario (10 dígitos)
   * @param {string} [userData.nationality] - Nacionalidad del usuario
   * @param {string} [userData.residenceDate] - Fecha de residencia (formato YYYY-MM-DD)
   * @returns {Object} Usuario creado con tokens de acceso y refresh
   * @throws {Error} Si el email ya está registrado (400)
   * @throws {Error} Si el documento ya está registrado (400)
   */
  async register(userData) {
    const { 
      name, 
      email, 
      password, 
      documentType, 
      documentNumber,
      phone,
      nationality,
      residenceDate
    } = userData;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const error = new Error('El correo electrónico ya está registrado');
      error.statusCode = 400;
      throw error;
    }

    // Verificar si el documento ya está registrado (si se proporcionó)
    if (documentType && documentNumber) {
      // SonarQube Fix: Remove await (findByDocument is synchronous)
      const existingDocument = User.findByDocument(documentType, documentNumber);
      if (existingDocument) {
        const error = new Error('El documento ya está registrado');
        error.statusCode = 400;
        throw error;
      }
    }

    // Crear usuario con todos los campos
    const user = await User.create({ 
      name, 
      email, 
      password, 
      documentType,  // Usar camelCase
      documentNumber, // Usar camelCase
      phone,
      nationality,
      residenceDate  // Usar camelCase
    });

    // Generar tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Guardar refresh token
    await User.updateRefreshToken(user.id, refreshToken);

    // Remover password del objeto user
    delete user.password;
    delete user.refreshToken;

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Autentica un usuario y genera tokens de sesión
   * Permite login con EMAIL + contraseña O DOCUMENTO + contraseña
   * @param {Object} credentials - Credenciales de login
   * @param {string} [credentials.email] - Email del usuario
   * @param {string} [credentials.documentType] - Tipo de documento (CC, CE)
   * @param {string} [credentials.documentNumber] - Número de documento
   * @param {string} credentials.password - Contraseña en texto plano
   * @returns {Object} Usuario autenticado con tokens
   * @throws {Error} Si las credenciales son inválidas (401)
   * @throws {Error} Si el usuario está inactivo (401)
   */
  async login(credentials) {
    const { email, documentType, documentNumber, password } = credentials;

    let user = null;

    // Intentar login con email si se proporciona
    if (email) {
      user = await User.findByEmail(email, true);
    }
    // Si no hay email, intentar login con documento
    else if (documentType && documentNumber) {
      // SonarQube Fix: Remove await (findByDocument is synchronous)
      user = User.findByDocument(documentType, documentNumber, true);
    }

    if (!user) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // Verificar contraseña
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Credenciales inválidas');
      error.statusCode = 401;
      throw error;
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      const error = new Error('La cuenta está desactivada');
      error.statusCode = 403;
      throw error;
    }

    // Generar tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Guardar refresh token
    await User.updateRefreshToken(user.id, refreshToken);

    // Remover password del objeto user
    delete user.password;
    delete user.refreshToken;

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Refrescar access token
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token no proporcionado');
      error.statusCode = 401;
      throw error;
    }

    // Verificar refresh token
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const { userId } = decoded;
      
      // Buscar usuario
      const user = await User.findById(userId);

      if (!user) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      // Verificar que el refresh token coincida
      const storedToken = user.refreshToken;
      const isValidRefresh = storedToken ? await bcrypt.compare(refreshToken, storedToken) : false;

      if (!isValidRefresh) {
        const error = new Error('Refresh token inválido');
        error.statusCode = 401;
        throw error;
      }
      
      // Generar nuevo access token
      const accessToken = generateToken(user.id);
      
      return { accessToken };
    } catch (err) {
      logger.error('Error al verificar refresh token', { error: err.message });
      const refreshError = new Error('Refresh token inválido o expirado');
      refreshError.statusCode = 401;
      throw refreshError;
    }
  }

  /**
   * Logout de usuario
   */
  async logout(userId) {
    // Invalidar refresh token
    await User.updateRefreshToken(userId, null);
    
    // Invalidar cache del usuario
    cache.delete(`user:${userId}`);
    logger.info(`Cache invalidado para user:${userId} en logout`);
    
    return true;
  }

  /**
   * Obtener perfil del usuario (con cache)
   */
  async getProfile(userId) {
    // Intentar obtener del cache
    const cacheKey = `user:${userId}`;
    const cachedUser = cache.get(cacheKey);
    
    if (cachedUser) {
      logger.debug(`Perfil de usuario ${userId} obtenido del cache`);
      return cachedUser;
    }

    // Si no está en cache, consultar BD
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
    logger.debug(`Perfil de usuario ${userId} guardado en cache`);

    return user;
  }
}

export default new AuthService();
