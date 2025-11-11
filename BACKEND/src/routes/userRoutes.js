import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getMe,
  updateMe,
  changePassword
} from '../controllers/userController.js';
import {
  validateUpdateUser,
  validateUserId,
  validateUserFilters
} from '../validators/userValidatorNew.js';
import {
  validateUpdateProfile,
  validateChangePassword
} from '../validators/authValidatorNew.js';

const router = express.Router();

// Proteger todas las rutas con JWT
router.use(protect);

// Rutas del usuario actual (con validación)
router.get('/me', getMe);
router.patch('/me', validateUpdateProfile, updateMe);
router.patch('/change-password', validateChangePassword, changePassword);

// Rutas de administrador (con validación)
router.get('/', restrictTo('admin'), validateUserFilters, getAllUsers);
router.get('/:id', restrictTo('admin'), validateUserId, getUserById);
router.patch('/:id', restrictTo('admin'), validateUserId, validateUpdateUser, updateUser);
router.delete('/:id', restrictTo('admin'), validateUserId, deleteUser);

export default router;
