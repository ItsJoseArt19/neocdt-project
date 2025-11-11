/**
 * CDT Helpers
 * Funciones auxiliares para operaciones con CDTs
 * Reduce duplicación de código en controllers
 */

/**
 * Calcula la fecha de vencimiento de un CDT
 * @param {string|Date} startDate - Fecha de inicio
 * @param {number} termMonths - Plazo en meses
 * @returns {string} Fecha de vencimiento en formato YYYY-MM-DD
 */
export const calculateEndDate = (startDate, termMonths) => {
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + termMonths);
  return endDate.toISOString().split('T')[0];
};

/**
 * Verifica si el usuario tiene permiso para acceder a un CDT
 * @param {Object} cdt - CDT a verificar
 * @param {Object} user - Usuario actual
 * @returns {boolean} true si tiene permiso, false en caso contrario
 */
export const hasAccessPermission = (cdt, user) => {
  return cdt.userId === user.id || user.role === 'admin';
};

/**
 * Verifica si el usuario puede modificar un CDT
 * Solo el propietario o admin pueden modificar
 * @param {Object} cdt - CDT a verificar
 * @param {Object} user - Usuario actual
 * @returns {boolean} true si puede modificar, false en caso contrario
 */
export const canModifyCDT = (cdt, user) => {
  return cdt.userId === user.id || user.role === 'admin';
};

/**
 * Verifica si un CDT puede ser editado según su estado
 * Solo draft y pending pueden ser editados
 * @param {string} status - Estado actual del CDT
 * @returns {boolean} true si puede editarse, false en caso contrario
 */
export const isEditable = (status) => {
  return status === 'draft' || status === 'pending';
};

/**
 * Verifica si un CDT puede ser eliminado según su estado
 * Solo draft y cancelled pueden ser eliminados
 * @param {string} status - Estado actual del CDT
 * @returns {boolean} true si puede eliminarse, false en caso contrario
 */
export const isDeletable = (status) => {
  return status === 'draft' || status === 'cancelled';
};

/**
 * Formatea los datos de filtros para paginación
 * @param {Object} query - Query params del request
 * @returns {Object} Filtros formateados para el modelo
 */
export const formatPaginationFilters = (query) => {
  const { page = 1, limit = 20, status, userId } = query;
  
  // SonarQube Fix: Use Number.parseInt() instead of global parseInt()
  const filters = {
    limit: Number.parseInt(limit, 10),
    offset: (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10)
  };

  if (status) filters.status = status;
  if (userId) filters.userId = userId;

  return {
    filters,
    page: Number.parseInt(page, 10),
    limit: Number.parseInt(limit, 10)
  };
};

/**
 * Crea una respuesta paginada estándar
 * @param {Array} data - Datos a paginar
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} limit - Registros por página
 * @returns {Object} Respuesta formateada con metadata de paginación
 */
export const createPaginatedResponse = (data, total, page, limit) => {
  return {
    status: 'success',
    results: data.length,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data
  };
};

/**
 * Valida que todos los campos requeridos para actualizar un CDT estén presentes
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
export const validateCDTUpdates = (updates) => {
  const errors = [];
  const allowedFields = ['amount', 'termMonths', 'interestRate', 'startDate'];
  
  const updateFields = Object.keys(updates);
  
  if (updateFields.length === 0) {
    errors.push('Debe proporcionar al menos un campo para actualizar');
  }
  
  // Verificar que solo se actualicen campos permitidos
  for (const field of updateFields) {
    if (!allowedFields.includes(field)) {
      errors.push(`El campo '${field}' no puede ser actualizado`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
