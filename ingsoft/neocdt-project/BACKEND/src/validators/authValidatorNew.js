import { body, validationResult } from 'express-validator';
import { DOCUMENT_TYPES, validateDocumentNumber } from '../config/financialRules.js';

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
 * Validador para registro de usuario con documento colombiano
 * Incluye validaciones condicionales para CE (nacionalidad y fecha de residencia)
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-záéíóúñü\s]+$/i)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es requerido')
    .isEmail()
    .withMessage('Por favor, proporciona un correo electrónico válido')
    .isLength({ max: 100 })
    .withMessage('El correo no puede exceder 100 caracteres')
    .normalizeEmail(),

  body('documentType')
    .optional()
    .isIn(['CC', 'CE'])
    .withMessage('Tipo de documento inválido. Use: CC o CE')
    .custom((value) => {
      if (value && !DOCUMENT_TYPES[value]) {
        throw new Error(`Tipo de documento no válido: ${value}`);
      }
      return true;
    }),

  body('documentNumber')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const { documentType } = req.body;
      if (value && documentType) {
        const validation = validateDocumentNumber(value, documentType);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),

  body('phone')
    .optional()
    .trim()
    .matches(/^3\d{9}$/)
    .withMessage('Ingrese un número celular válido de 10 dígitos que inicie con 3'),

  // Validación condicional: nationality (requerido solo para CE)
  body('nationality')
    .if(body('documentType').equals('CE'))
    .notEmpty()
    .withMessage('La nacionalidad es requerida para Cédula de Extranjería')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('La nacionalidad debe tener entre 3 y 50 caracteres'),

  // Validación condicional: residenceDate (requerido solo para CE)
  body('residenceDate')
    .if(body('documentType').equals('CE'))
    .notEmpty()
    .withMessage('La fecha de residencia es requerida para Cédula de Extranjería')
    .isISO8601()
    .withMessage('La fecha de residencia debe ser una fecha válida (YYYY-MM-DD)'),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validador para login
 * Permite login con EMAIL + contraseña O DOCUMENTO + contraseña
 */
export const validateLogin = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Por favor, proporciona un correo electrónico válido'),

  body('documentType')
    .optional()
    .trim()
    .isIn(['CC', 'CE'])
    .withMessage('El tipo de documento debe ser CC o CE'),

  body('documentNumber')
    .optional()
    .trim()
    .custom((value, { req }) => {
      const { documentType } = req.body;
      
      if (!value && !req.body.email) {
        throw new Error('Debes proporcionar email o documento + número de documento');
      }
      
      // Validar según tipo de documento si se proporciona
      if (value && documentType) {
        if (documentType === 'CC') {
          if (!/^\d{7,10}$/.test(value)) {
            throw new Error('El número de cédula debe contener entre 7 y 10 dígitos');
          }
        } else if (documentType === 'CE') {
          if (!/^\d{6,9}$/.test(value)) {
            throw new Error('El número de cédula de extranjería debe contener entre 6 y 9 dígitos');
          }
        }
      }
      
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),

  handleValidationErrors
];

/**
 * Validador para actualizar perfil (incluye documento)
 */
export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-záéíóúñü\s]+$/i)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Por favor, proporciona un correo electrónico válido')
    .isLength({ max: 100 })
    .withMessage('El correo no puede exceder 100 caracteres')
    .normalizeEmail(),

  body('documentType')
    .optional()
    .isIn(['CC', 'CE'])
    .withMessage('Tipo de documento inválido. Use: CC o CE'),

  body('documentNumber')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (value && req.body.documentType) {
        const validation = validateDocumentNumber(value, req.body.documentType);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),

  body('phone')
    .optional()
    .trim()
    .matches(/^3\d{9}$/)
    .withMessage('Ingrese un número celular válido de 10 dígitos que inicie con 3'),

  body('nationality')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('La nacionalidad debe tener entre 3 y 50 caracteres'),

  body('residenceDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de residencia debe ser una fecha válida (YYYY-MM-DD)'),

  handleValidationErrors
];

/**
 * Validador para cambio de contraseña
 */
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),

  body('newPassword')
    .notEmpty()
    .withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validador para refresh token
 */
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('El refresh token es requerido')
    .isJWT()
    .withMessage('El refresh token debe ser un JWT válido'),

  handleValidationErrors
];
