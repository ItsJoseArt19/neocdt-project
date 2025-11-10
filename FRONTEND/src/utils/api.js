import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = 'http://localhost:5001/api/v1';

// Crear instancia de axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 segundos
});

// Interceptor para agregar el token en cada request
api.interceptors.request.use(
    (config) => {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                const token = user?.accessToken;
                
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (error) {
            // Si hay error al parsear, simplemente continuamos sin token
            console.error('Error al obtener token:', error);
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // NO limpiar la sesión automáticamente en errores 401
        // Dejar que cada componente maneje sus propios errores
        // Si realmente necesitas cerrar sesión, el componente debe hacerlo explícitamente
        
        // Solo registrar el error para debugging
        if (error.response?.status === 401) {
            console.warn('Error 401: No autorizado', error.response?.data);
        }
        
        return Promise.reject(error);
    }
);

// ===== ENDPOINTS DE AUTENTICACIÓN =====

/**
 * Registrar un nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Promise} - Respuesta del servidor
 */
export const registerUser = async (userData) => {
    try {
        const response = await api.post('/auth/register', {
            documentType: userData.documentType,
            documentNumber: userData.documentNumber,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            nationality: userData.nationality || undefined,
            residenceDate: userData.residenceDate || undefined,
            password: userData.password,
            confirmPassword: userData.confirmPassword
        });
        
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Iniciar sesión
 * @param {Object} credentials - Credenciales del usuario
 * @returns {Promise} - Respuesta del servidor con tokens
 */
export const loginUser = async (credentials) => {
    try {
        const response = await api.post('/auth/login', {
            documentType: credentials.documentType,
            documentNumber: credentials.documentNumber,
            password: credentials.password
        });
        
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Cerrar sesión
 * @returns {Promise} - Respuesta del servidor
 */
export const logoutUser = async () => {
    try {
        const response = await api.post('/auth/logout');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Refrescar token de acceso
 * @param {string} refreshToken - Token de refresh
 * @returns {Promise} - Respuesta del servidor con nuevo accessToken
 */
export const refreshToken = async (refreshToken) => {
    try {
        const response = await api.post('/auth/refresh', { refreshToken });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ===== ENDPOINTS DE USUARIO =====

/**
 * Obtener información del usuario autenticado
 * @returns {Promise} - Datos del usuario
 */
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Actualizar información del usuario
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise} - Usuario actualizado
 */
export const updateUser = async (updateData) => {
    try {
        const response = await api.patch('/users/me', updateData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ===== ENDPOINTS DE CDT =====

/**
 * Obtener todos los CDTs del usuario autenticado
 * @returns {Promise} - Lista de CDTs
 */
export const getUserCDTs = async () => {
    const response = await api.get('/cdts/my-cdts');
    // Backend retorna: { status: 'success', data: { cdts: [...], pagination: {...} } }
    // Retornamos solo data.data para que el frontend acceda directamente a cdts
    return response.data.data;
};

/**
 * Obtener un CDT específico por ID
 * @param {string} cdtId - ID del CDT
 * @returns {Promise} - Datos del CDT
 */
export const getCDTById = async (cdtId) => {
    const response = await api.get(`/cdts/${cdtId}`);
    // Backend retorna: { status: 'success', data: { cdt: {...} } }
    return response.data.data;
};

/**
 * Crear un nuevo CDT
 * @param {Object} cdtData - Datos del CDT
 * @returns {Promise} - CDT creado
 */
export const createCDT = async (cdtData) => {
    // Convertir meses a días (1 mes = 30 días)
    const termDays = cdtData.term_months 
        ? cdtData.term_months * 30 
        : cdtData.termDays;
    
    // Mapear renovation_type a renovationOption
    let renovationOption = 'capital'; // default
    if (cdtData.renovation_type === 'capital_interest') {
        renovationOption = 'capital_interest';
    }
    
    const response = await api.post('/cdts', {
        amount: cdtData.amount,
        termDays: termDays,
        interestRate: cdtData.interest_rate || cdtData.interestRate,
        startDate: cdtData.start_date || cdtData.startDate,
        renovationOption: renovationOption
    });
    
    // Backend retorna: { status: 'success', message: '...', data: { cdt: {...} } }
    return response.data.data;
};

/**
 * Actualizar un CDT (solo en estado 'draft')
 * @param {string} cdtId - ID del CDT
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise} - CDT actualizado
 */
export const updateCDT = async (cdtId, updateData) => {
    const response = await api.patch(`/cdts/${cdtId}`, updateData);
    return response.data.data;
};

/**
 * Activar un CDT (cambiar de 'draft' a 'active')
 * @param {string} cdtId - ID del CDT
 * @returns {Promise} - CDT activado
 */
export const activateCDT = async (cdtId) => {
    const response = await api.post(`/cdts/${cdtId}/activate`);
    return response.data.data;
};

/**
 * Cancelar un CDT
 * @param {string} cdtId - ID del CDT
 * @param {string} reason - Razón de cancelación
 * @returns {Promise} - CDT cancelado
 */
export const cancelCDT = async (cdtId, reason) => {
    const response = await api.post(`/cdts/${cdtId}/cancel`, { reason });
    return response.data.data;
};

/**
 * Enviar CDT a revisión (draft -> pending)
 * @param {string} cdtId - ID del CDT
 * @returns {Promise} - CDT actualizado
 */
export const submitCDTForReview = async (cdtId) => {
    const response = await api.post(`/cdts/${cdtId}/submit`);
    return response.data.data;
};

/**
 * Aprobar CDT (admin) (pending -> active)
 * @param {string} cdtId - ID del CDT
 * @param {string} adminNotes - Notas opcionales del admin
 * @returns {Promise} - CDT aprobado
 */
export const approveCDT = async (cdtId, adminNotes = null) => {
    const response = await api.post(`/cdts/${cdtId}/approve`, { adminNotes });
    return response.data.data;
};

/**
 * Rechazar CDT (admin) (pending -> rejected)
 * @param {string} cdtId - ID del CDT
 * @param {string} adminNotes - Razón del rechazo (requerido)
 * @returns {Promise} - CDT rechazado
 */
export const rejectCDT = async (cdtId, adminNotes) => {
    const response = await api.post(`/cdts/${cdtId}/reject`, { adminNotes });
    return response.data.data;
};

/**
 * Obtener CDTs pendientes de aprobación (admin)
 * @returns {Promise} - Lista de CDTs pendientes
 */
export const getPendingCDTs = async () => {
    const response = await api.get('/cdts/admin/pending');
    // Backend retorna: { status: 'success', results: X, data: { cdts: [...] } }
    return response.data.data;
};

/**
 * Obtener todos los CDTs con filtros (admin)
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise} - Lista de CDTs
 */
export const getAllCDTsForAdmin = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/cdts/admin/all?${params.toString()}`);
    return response.data.data;
};

/**
 * Obtener estadísticas para dashboard de admin
 * @returns {Promise} - Estadísticas generales
 */
export const getAdminStats = async () => {
    const response = await api.get('/cdts/admin/stats');
    // Backend retorna: { status: 'success', data: { stats: {...} } }
    // Retornamos directamente el objeto stats
    return response.data.data.stats;
};

/**
 * Obtener log de auditoría de un CDT
 * @param {string} cdtId - ID del CDT
 * @returns {Promise} - Lista de eventos de auditoría
 */
export const getCDTAuditLog = async (cdtId) => {
    try {
        const response = await api.get(`/cdts/${cdtId}/audit`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Renovar un CDT
 * @param {string} cdtId - ID del CDT
 * @param {Object} renewalData - Datos de renovación
 * @returns {Promise} - Nuevo CDT creado
 */
export const renewCDT = async (cdtId, renewalData) => {
    try {
        const response = await api.post(`/cdts/${cdtId}/renew`, renewalData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// ===== UTILIDADES =====

/**
 * Extraer mensaje de error legible
 * @param {Error} error - Error de axios
 * @returns {string} - Mensaje de error
 */
export const getErrorMessage = (error) => {
    if (error.response) {
        // Error del servidor
        const data = error.response.data;
        
        // Si hay errores de validación
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            return data.errors.map(err => err.msg).join('. ');
        }
        
        // Mensaje general del servidor
        return data.message || 'Error en el servidor';
    } else if (error.request) {
        // Error de red
        return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else {
        // Error desconocido
        return error.message || 'Error desconocido';
    }
};

export default api;
