import express from 'express';
import { register, login, refreshAccessToken, logout, getProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { 
  validateRegister, 
  validateLogin, 
  validateRefreshToken 
} from '../validators/authValidatorNew.js';

const router = express.Router();

// Rutas públicas (con rate limiting y validación)
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshAccessToken);

// Rutas protegidas (con autenticación JWT)
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);

export default router;
