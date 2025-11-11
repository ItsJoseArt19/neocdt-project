import { body, query, param, validationResult } from 'express-validator';
import { 
  CDT_RULES, 
  validateCDTAmount, 
  validateCDTTerm, 
  validateInterestRate 
} from '../config/financialRules.js';

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
 * Validador para crear CDT con reglas colombianas
 * Monto mínimo: $500,000 COP
 * Plazo máximo: 24 meses (2 años)
 * Tasa máxima: 9.0% EA
 */
export const validateCreateCDT = [
  body('amount')
    .notEmpty()
    .withMessage('El monto es requerido')
    .isFloat({ min: CDT_RULES.amount.min, max: CDT_RULES.amount.max })
    .withMessage(`El monto debe estar entre $${CDT_RULES.amount.min.toLocaleString('es-CO')} y $${CDT_RULES.amount.max.toLocaleString('es-CO')} COP`)
    .toFloat()
    .custom((value) => {
      const validation = validateCDTAmount(value);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('termDays')
    .notEmpty()
    .withMessage('El plazo es requerido')
    .isInt({ min: CDT_RULES.term.minDays, max: CDT_RULES.term.maxDays })
    .withMessage(`El plazo debe estar entre ${CDT_RULES.term.minDays} y ${CDT_RULES.term.maxDays} días (máximo 2 años)`)
    .toInt()
    .custom((value) => {
      const validation = validateCDTTerm(value);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('interestRate')
    .notEmpty()
    .withMessage('La tasa de interés es requerida')
    .isFloat({ min: CDT_RULES.interestRate.min, max: CDT_RULES.interestRate.max })
    .withMessage(`La tasa de interés debe estar entre ${CDT_RULES.interestRate.min}% y ${CDT_RULES.interestRate.max}% EA (Efectiva Anual)`)
    .toFloat()
    .custom((value) => {
      const validation = validateInterestRate(value);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      return true;
    }),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser una fecha válida (formato ISO 8601)')
    .custom((value) => {
      if (value) {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (inputDate < today) {
          throw new Error('La fecha de inicio no puede ser en el pasado');
        }
        
        // Validar que no sea más de 30 días en el futuro
        const maxFutureDate = new Date(today);
        maxFutureDate.setDate(maxFutureDate.getDate() + 30);
        
        if (inputDate > maxFutureDate) {
          throw new Error('La fecha de inicio no puede ser mayor a 30 días en el futuro');
        }
      }
      return true;
    }),

  body('renovationOption')
    .optional()
    .isIn(['capital', 'capital_interest', 'auto'])
    .withMessage('La opción de renovación debe ser: capital, capital_interest o auto'),

  handleValidationErrors
];

/**
 * Validador para actualizar CDT (solo draft y pending)
 */
export const validateUpdateCDT = [
  body('amount')
    .optional()
    .isFloat({ min: CDT_RULES.amount.min, max: CDT_RULES.amount.max })
    .withMessage(`El monto debe estar entre $${CDT_RULES.amount.min.toLocaleString('es-CO')} y $${CDT_RULES.amount.max.toLocaleString('es-CO')} COP`)
    .toFloat()
    .custom((value) => {
      if (value) {
        const validation = validateCDTAmount(value);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),

  // Aceptar tanto termDays (camelCase) como term_days (snake_case)
  body('termDays')
    .optional()
    .isInt({ min: CDT_RULES.term.minDays, max: CDT_RULES.term.maxDays })
    .withMessage(`El plazo debe estar entre ${CDT_RULES.term.minDays} y ${CDT_RULES.term.maxDays} días`)
    .toInt()
    .custom((value) => {
      if (value) {
        const validation = validateCDTTerm(value);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),

  body('term_days')
    .optional()
    .isInt({ min: CDT_RULES.term.minDays, max: CDT_RULES.term.maxDays })
    .withMessage(`El plazo debe estar entre ${CDT_RULES.term.minDays} y ${CDT_RULES.term.maxDays} días`)
    .toInt()
    .custom((value) => {
      if (value) {
        const validation = validateCDTTerm(value);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),

  // Aceptar tanto interestRate (camelCase) como interest_rate (snake_case)
  body('interestRate')
    .optional()
    .isFloat({ min: CDT_RULES.interestRate.min, max: CDT_RULES.interestRate.max })
    .withMessage(`La tasa debe estar entre ${CDT_RULES.interestRate.min}% y ${CDT_RULES.interestRate.max}% EA`)
    .toFloat()
    .custom((value) => {
      if (value) {
        const validation = validateInterestRate(value);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),

  body('interest_rate')
    .optional()
    .isFloat({ min: CDT_RULES.interestRate.min, max: CDT_RULES.interestRate.max })
    .withMessage(`La tasa debe estar entre ${CDT_RULES.interestRate.min}% y ${CDT_RULES.interestRate.max}% EA`)
    .toFloat()
    .custom((value) => {
      if (value) {
        const validation = validateInterestRate(value);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }
      return true;
    }),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser una fecha válida (formato ISO 8601)')
    .custom((value) => {
      if (value) {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (inputDate < today) {
          throw new Error('La fecha de inicio no puede ser en el pasado');
        }
        
        const maxFutureDate = new Date(today);
        maxFutureDate.setDate(maxFutureDate.getDate() + 30);
        
        if (inputDate > maxFutureDate) {
          throw new Error('La fecha de inicio no puede ser mayor a 30 días en el futuro');
        }
      }
      return true;
    }),

  body('renovationOption')
    .optional()
    .isIn(['capital', 'capital_interest', 'auto'])
    .withMessage('La opción de renovación debe ser: capital, capital_interest o auto'),

  handleValidationErrors
];

/**
 * Validador para cambiar estado de CDT
 */
export const validateChangeStatus = [
  body('status')
    .notEmpty()
    .withMessage('El estado es requerido')
    .isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'])
    .withMessage('Estado inválido'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La razón no puede exceder los 500 caracteres'),

  handleValidationErrors
];

/**
 * Validador para cancelar CDT
 */
export const validateCancelCDT = [
  body('reason')
    .notEmpty()
    .withMessage('La razón de cancelación es requerida')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La razón debe tener entre 10 y 500 caracteres'),

  handleValidationErrors
];

/**
 * Validador para parámetros de ID
 */
export const validateCDTId = [
  param('id')
    .notEmpty()
    .withMessage('El ID del CDT es requerido')
    .isUUID()
    .withMessage('El ID del CDT debe ser un UUID válido'),

  handleValidationErrors
];

/**
 * Validador para query params de listado de CDTs
 */
export const validateCDTFilters = [
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

  query('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'])
    .withMessage('Estado inválido'),

  query('userId')
    .optional()
    .isUUID()
    .withMessage('El userId debe ser un UUID válido'),

  handleValidationErrors
];
