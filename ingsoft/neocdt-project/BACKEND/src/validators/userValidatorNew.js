import { body, query, param, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validador para actualizar usuario (admin)
 */
export const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-záéíóúñü\s]+$/i)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Por favor, proporciona un correo electrónico válido')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('El rol debe ser "user" o "admin"'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano')
    .toBoolean(),

  handleValidationErrors
];

/**
 * Validador para parámetros de ID de usuario
 */
export const validateUserId = [
  param('id')
    .notEmpty()
    .withMessage('El ID del usuario es requerido')
    .isUUID()
    .withMessage('El ID del usuario debe ser un UUID válido'),

  handleValidationErrors
];

/**
 * Validador para query params de listado de usuarios
 */
export const validateUserFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100')
    .toInt(),

  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('El rol debe ser "user" o "admin"'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano')
    .toBoolean(),

  handleValidationErrors
];
