import bcrypt from 'bcryptjs';
import authService from '../services/authService.js';
import { asyncHandler, sendCreated } from '../utils/asyncHandler.js';
import User from '../models/userModel.js';
import { verifyRefreshToken, generateToken } from '../utils/jwt.js';

export const register = asyncHandler(async (req, res) => {
  // Los datos ya están validados por el middleware
  const result = await authService.register(req.body);
  return sendCreated(res, result);
}, 'register', 'user-registration');

export const login = asyncHandler(async (req, res) => {
  // Los datos ya están validados por el middleware
  const result = await authService.login(req.body);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
}, 'login', 'user-login');

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      status: 'fail',
      message: 'El token de actualización es requerido'
    });
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token de actualización inválido'
    });
  }

  // Verificar que el refresh token coincide
  const userWithToken = await User.findByEmail(user.email, true);
  const storedToken = userWithToken?.refreshToken;
  const isValidRefresh = storedToken ? await bcrypt.compare(refreshToken, storedToken) : false;

  if (!isValidRefresh) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token de actualización inválido'
    });
  }

  const newAccessToken = generateToken(user.id);

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: newAccessToken
    }
  });
}, 'refreshAccessToken', 'refresh-token');

export const logout = asyncHandler(async (req, res) => {
  await User.updateRefreshToken(req.user.id, null);
  
  res.status(200).json({
    status: 'success',
    message: 'Sesión cerrada exitosamente'
  });
}, 'logout', 'user-logout');

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'Usuario no encontrado'
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: { user }
  });
}, 'getProfile', 'get-profile');
