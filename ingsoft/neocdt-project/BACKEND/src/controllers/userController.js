import User from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, isActive } = req.query;
  
  // SonarQube Fix: Use Number.parseInt() instead of global parseInt()
  const filters = {
    limit: Number.parseInt(limit, 10),
    offset: (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10)
  };

  if (role) filters.role = role;
  if (isActive !== undefined) filters.isActive = isActive === 'true';

  const users = await User.findAll(filters);
  const total = await User.count({ role, isActive: filters.isActive });

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page: Number.parseInt(page, 10),
    totalPages: Math.ceil(total / Number.parseInt(limit, 10)),
    data: { users }
  });
}, 'getAllUsers', 'list-users');

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

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
}, 'getUserById', 'get-user');

export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, isActive, document_type, document_number } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive ? 1 : 0;
  if (document_type) updates.document_type = document_type;
  if (document_number) updates.document_number = document_number;

  const user = await User.update(req.params.id, updates);

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
}, 'updateUser', 'update-user');

export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await User.deleteById(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      status: 'fail',
      message: 'Usuario no encontrado'
    });
  }

  res.status(204).send();
}, 'deleteUser', 'delete-user');

export const getMe = asyncHandler(async (req, res) => {
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
}, 'getMe', 'get-me');

export const updateMe = asyncHandler(async (req, res) => {
  // La validación ya fue hecha por el middleware validateUpdateProfile
  const { name, email } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email;

  const user = await User.update(req.user.id, updates);

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
}, 'updateMe', 'update-me');

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      status: 'fail',
      message: 'Por favor, proporciona la contraseña actual y la nueva'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      status: 'fail',
      message: 'La nueva contraseña debe tener al menos 8 caracteres'
    });
  }

  // Obtener usuario con contraseña
  const user = await User.findByEmail(req.user.email, true);

  // Verificar contraseña actual
  const isValid = await User.comparePassword(currentPassword, user.password);
  if (!isValid) {
    return res.status(401).json({
      status: 'fail',
      message: 'La contraseña actual es incorrecta'
    });
  }

  // Actualizar contraseña
  await User.updatePassword(req.user.id, newPassword);

  res.status(200).json({
    status: 'success',
    message: 'Contraseña actualizada exitosamente'
  });
}, 'changePassword', 'change-password');