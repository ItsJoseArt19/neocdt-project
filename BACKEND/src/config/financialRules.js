/**
 * Reglas de Negocio Financieras para CDTs en Colombia
 * Basadas en normativas del sistema financiero colombiano
 * 
 * Referencias:
 * - Superintendencia Financiera de Colombia
 * - Normas bancarias vigentes 2025
 */

/**
 * Tipos de documento válidos en Colombia
 * Solo CC (Cédula de Ciudadanía) y CE (Cédula de Extranjería)
 */
export const DOCUMENT_TYPES = {
  CC: {
    code: 'CC',
    name: 'Cédula de Ciudadanía',
    pattern: /^\d{7,10}$/,
    minLength: 7,
    maxLength: 10,
    description: 'Documento de identidad para ciudadanos colombianos (7-10 dígitos)',
    requiresCitizenship: true
  },
  CE: {
    code: 'CE',
    name: 'Cédula de Extranjería',
    pattern: /^\d{6,9}$/,
    minLength: 6,
    maxLength: 9,
    description: 'Documento para extranjeros residentes en Colombia (6-9 dígitos)',
    requiresCitizenship: false,
    additionalValidation: true, // Requiere nacionalidad y fecha de residencia
    requiresNationality: true,
    requiresResidenceDate: true
  }
};

/**
 * Reglas para CDTs según normativa colombiana
 */
export const CDT_RULES = {
  // Montos en pesos colombianos (COP)
  amount: {
    min: 500000,          // $500,000 COP (monto mínimo real)
    max: 500000000,       // $500,000,000 COP (500 millones)
    currency: 'COP',
    description: 'Monto mínimo $500,000 COP según normativa bancaria'
  },
  
  // Plazos en días (igual que el frontend)
  term: {
    minDays: 30,          // 30 días mínimo (1 mes)
    maxDays: 730,         // 730 días (2 años) máximo
    recommendedDays: [90, 180, 270, 360, 540, 720], // Plazos comunes (3, 6, 9, 12, 18, 24 meses)
    description: 'Plazo entre 30 y 730 días (máximo 2 años)'
  },
  
  // Tasas de interés efectiva anual (EA)
  interestRate: {
    min: 0.5,             // 0.5% EA mínimo
    max: 9.5,             // 9.5% EA máximo (tasa competitiva en Colombia)
    typical: {
      '1-3': 4.5,         // 1-3 meses: ~4.5% EA
      '4-6': 5.5,         // 4-6 meses: ~5.5% EA
      '7-12': 6.5,        // 7-12 meses: ~6.5% EA
      '13-24': 7.5        // 13-24 meses: ~7.5% EA
    },
    currency: 'COP',
    type: 'EA',           // Efectiva Anual
    description: 'Tasa máxima 9.5% EA según mercado colombiano 2025'
  },
  
  // Estados del CDT
  status: {
    draft: {
      code: 'draft',
      name: 'Borrador',
      description: 'CDT en creación, no enviado a aprobación',
      canEdit: true,
      canDelete: true
    },
    pending: {
      code: 'pending',
      name: 'Pendiente',
      description: 'CDT enviado para aprobación administrativa',
      canEdit: false,
      canDelete: false,
      requiresApproval: true
    },
    active: {
      code: 'active',
      name: 'Activo',
      description: 'CDT aprobado y en curso',
      canEdit: false,
      canDelete: false,
      generatesInterest: true
    },
    completed: {
      code: 'completed',
      name: 'Completado',
      description: 'CDT finalizado al vencimiento',
      canEdit: false,
      canDelete: false
    },
    cancelled: {
      code: 'cancelled',
      name: 'Cancelado',
      description: 'CDT cancelado antes del vencimiento',
      canEdit: false,
      canDelete: true,
      requiresReason: true
    }
  }
};

/**
 * Reglas de validación de usuarios
 */
export const USER_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-záéíóúñü\s]+$/i,
    description: 'Solo letras y espacios'
  },
  
  email: {
    maxLength: 100,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Email válido'
  },
  
  password: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    description: 'Mínimo 8 caracteres, una mayúscula, una minúscula y un número'
  },
  
  phone: {
    pattern: /^3\d{9}$/,
    length: 10,
    description: 'Número celular colombiano (10 dígitos iniciando con 3)'
  },
  
  nationality: {
    minLength: 3,
    maxLength: 50,
    description: 'País de nacionalidad (requerido para CE)'
  },
  
  residenceDate: {
    description: 'Fecha de residencia en Colombia (requerido para CE)'
  },
  
  documentNumber: {
    CC: {
      minLength: 7,
      maxLength: 10,
      pattern: /^\d{7,10}$/
    },
    CE: {
      minLength: 6,
      maxLength: 9,
      pattern: /^\d{6,9}$/
    }
  }
};

/**
 * Valida un tipo de documento
 * @param {string} type - Tipo de documento (CC, CE, NIT, PA)
 * @returns {boolean} true si es válido
 */
export const isValidDocumentType = (type) => {
  return Object.keys(DOCUMENT_TYPES).includes(type);
};

/**
 * Valida un número de documento según su tipo
 * @param {string} documentNumber - Número de documento
 * @param {string} documentType - Tipo de documento
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateDocumentNumber = (documentNumber, documentType) => {
  if (!isValidDocumentType(documentType)) {
    return {
      valid: false,
      error: `Tipo de documento inválido. Use: ${Object.keys(DOCUMENT_TYPES).join(', ')}`
    };
  }
  
  const docType = DOCUMENT_TYPES[documentType];
  
  if (!docType.pattern.test(documentNumber)) {
    return {
      valid: false,
      error: `Número de documento inválido para ${docType.name}. ${docType.description}`
    };
  }
  
  if (documentNumber.length < docType.minLength || documentNumber.length > docType.maxLength) {
    return {
      valid: false,
      error: `El ${docType.name} debe tener entre ${docType.minLength} y ${docType.maxLength} caracteres`
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida monto de CDT
 * @param {number} amount - Monto en COP
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateCDTAmount = (amount) => {
  if (amount < CDT_RULES.amount.min) {
    return {
      valid: false,
      error: `El monto mínimo es $${CDT_RULES.amount.min.toLocaleString('es-CO')} COP`
    };
  }
  
  if (amount > CDT_RULES.amount.max) {
    return {
      valid: false,
      error: `El monto máximo es $${CDT_RULES.amount.max.toLocaleString('es-CO')} COP`
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida plazo de CDT en días
 * @param {number} termDays - Plazo en días
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateCDTTerm = (termDays) => {
  if (termDays < CDT_RULES.term.minDays) {
    return {
      valid: false,
      error: `El plazo mínimo es ${CDT_RULES.term.minDays} días`
    };
  }
  
  if (termDays > CDT_RULES.term.maxDays) {
    return {
      valid: false,
      error: `El plazo máximo es ${CDT_RULES.term.maxDays} días (2 años)`
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Valida tasa de interés de CDT
 * @param {number} rate - Tasa en % EA
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateInterestRate = (rate) => {
  if (rate < CDT_RULES.interestRate.min) {
    return {
      valid: false,
      error: `La tasa mínima es ${CDT_RULES.interestRate.min}% EA`
    };
  }
  
  if (rate > CDT_RULES.interestRate.max) {
    return {
      valid: false,
      error: `La tasa máxima es ${CDT_RULES.interestRate.max}% EA`
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Obtiene la tasa típica recomendada según el plazo en días
 * @param {number} termDays - Plazo en días
 * @returns {number} Tasa recomendada
 */
export const getRecommendedRate = (termDays) => {
  if (termDays <= 90) return CDT_RULES.interestRate.typical['1-3'];      // 1-3 meses
  if (termDays <= 180) return CDT_RULES.interestRate.typical['4-6'];     // 4-6 meses
  if (termDays <= 360) return CDT_RULES.interestRate.typical['7-12'];    // 7-12 meses
  return CDT_RULES.interestRate.typical['13-24'];                         // 13-24 meses
};

/**
 * Calcula la fecha final del CDT
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {number} termDays - Plazo en días
 * @returns {string} Fecha final (YYYY-MM-DD)
 */
export const calculateEndDate = (startDate, termDays) => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + termDays);
  
  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, '0');
  const day = String(end.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calcula el retorno esperado del CDT
 * Fórmula: Monto * (1 + (Tasa/100))^(Plazo/360)
 * @param {number} amount - Monto inicial
 * @param {number} interestRate - Tasa en % EA
 * @param {number} termDays - Plazo en días
 * @returns {number} Retorno esperado
 */
export const calculateExpectedReturn = (amount, interestRate, termDays) => {
  const rateDecimal = interestRate / 100;
  const timeInYears = termDays / 360;
  const returnComputed = amount * Math.pow(1 + rateDecimal, timeInYears);
  return Math.round(returnComputed - amount);
};

export default {
  DOCUMENT_TYPES,
  CDT_RULES,
  USER_RULES,
  isValidDocumentType,
  validateDocumentNumber,
  validateCDTAmount,
  validateCDTTerm,
  validateInterestRate,
  getRecommendedRate,
  calculateEndDate,
  calculateExpectedReturn
};
