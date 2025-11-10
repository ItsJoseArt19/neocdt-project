import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Genera un token JWT de acceso para autenticación
 * @param {string} userId - UUID del usuario
 * @returns {string} Token JWT firmado con expiración corta
 * @throws {Error} Si userId es inválido o falta configuración
 */
export const generateToken = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId inválido para generar token');
  }
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};

/**
 * Genera un refresh token JWT para renovación de sesión
 * @param {string} userId - UUID del usuario
 * @returns {string} Refresh token JWT con expiración larga
 * @throws {Error} Si userId es inválido o falta configuración
 */
export const generateRefreshToken = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId inválido para generar refresh token');
  }
  return jwt.sign({ userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpire
  });
};

/**
 * Verifica y decodifica un token JWT de acceso
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token es inválido, expirado o malformado
 */
export const verifyToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token inválido o ausente');
  }
  return jwt.verify(token, config.jwtSecret);
};

/**
 * Verifica y decodifica un refresh token JWT
 * @param {string} token - Refresh token JWT a verificar
 * @returns {Object} Payload decodificado del refresh token
 * @throws {Error} Si el refresh token es inválido, expirado o malformado
 */
export const verifyRefreshToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Refresh token inválido o ausente');
  }
  return jwt.verify(token, config.jwtRefreshSecret);
};
