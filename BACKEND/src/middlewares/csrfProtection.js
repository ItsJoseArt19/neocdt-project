import csrf from 'csurf';

/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 * 
 * Protege contra ataques CSRF validando tokens en requests que modifican datos
 * Configurado para usar cookies en lugar de sesiones para mejor escalabilidad
 * 
 * Uso:
 * - El token CSRF se genera automáticamente en req.csrfToken()
 * - El frontend debe incluir este token en requests POST/PUT/DELETE
 * - Se puede enviar en header X-CSRF-Token o en body _csrf
 * 
 * Seguridad: OWASP A01:2021 - Broken Access Control
 * @see https://owasp.org/www-community/attacks/csrf
 */
export const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,  // Previene acceso desde JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only en producción
    sameSite: 'strict'  // Previene CSRF attacks
  } 
});

export default csrfProtection;
