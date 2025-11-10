import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter para Autenticación (Anti Brute-Force)
 * 
 * Protege contra ataques de fuerza bruta en endpoints de autenticación
 * Límite: 20 intentos por 15 minutos por dirección IP (modo desarrollo)
 * 
 * NOTA: En producción, cambiar max a 5 para mayor seguridad
 * 
 * Características:
 * - Solo cuenta intentos fallidos (skipSuccessfulRequests: true)
 * - Bloqueo temporal de 15 minutos tras exceder límite
 * - Headers estándar RateLimit-* en respuesta
 * 
 * Seguridad: OWASP A07:2021 - Identification and Authentication Failures
 * Aplica a: /api/v1/auth/login, /api/v1/auth/register
 * 
 * @returns {Function} Middleware de Express
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 intentos (modo desarrollo - cambiar a 5 en producción)
  message: {
    status: 'fail',
    message: 'Demasiados intentos de autenticación desde esta IP. Por favor, intente nuevamente en 15 minutos.'
  },
  skipSuccessfulRequests: true, // No contar requests exitosas (solo fallidas)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Cuenta temporalmente bloqueada por demasiados intentos fallidos. Intente en 15 minutos.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate Limiter Estricto para operaciones sensibles
 * Límite: 3 intentos por 15 minutos
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    status: 'fail',
    message: 'Demasiados intentos. Operación bloqueada temporalmente.'
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Operación bloqueada por seguridad. Intente en 15 minutos.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate Limiter para APIs públicas
 * Límite: 20 requests por minuto
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20,
  message: {
    status: 'fail',
    message: 'Demasiadas solicitudes. Por favor, espere un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Límite de requests alcanzado. Intente en 1 minuto.',
      retryAfter: '1 minute'
    });
  }
});
