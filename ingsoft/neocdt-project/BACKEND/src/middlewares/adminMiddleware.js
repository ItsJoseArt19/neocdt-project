/**
 * Middleware para verificar que el usuario tiene permisos de administrador
 * Debe usarse después del authMiddleware que valida el token y agrega req.user
 */

export const adminOnly = (req, res, next) => {
  // Verificar que existe el usuario (authMiddleware debe ejecutarse primero)
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'No autenticado. Inicia sesión primero.'
    });
  }

  // Verificar que el usuario es administrador
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }

  // Usuario es admin, continuar
  next();
};

export default adminOnly;
