import { asyncHandler } from '../utils/asyncHandler.js';
import cdtService from '../services/cdtService.js';
import { formatPaginationFilters } from './helpers/cdtHelpers.js';

/**
 * Crea un nuevo CDT (Certificado de Depósito a Término)
 * Los datos ya fueron validados por validateCreateCDT middleware
 * @route POST /api/v1/cdts
 * @access Private (Usuario autenticado)
 */
export const createCDT = asyncHandler(async (req, res) => {
  const cdt = cdtService.createCDT(req.user.id, req.body);

  return res.status(201).json({
    status: 'success',
    data: { cdt }
  });
}, 'createCDT', 'create-cdt');

/**
 * Obtiene todos los CDTs del usuario autenticado
 * Soporta paginación y filtrado por estado
 * @route GET /api/v1/cdts/my-cdts
 * @access Private (Usuario autenticado)
 * @param {Object} req - Request con query params (page, limit, status)
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} Lista paginada de CDTs del usuario
 */
export const getMyCDTs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  // SonarQube Fix: Use Number.parseInt() instead of global parseInt()
  const filterParams = {
    page: Number.parseInt(page, 10),
    limit: Number.parseInt(limit, 10)
  };

  if (status) {
    filterParams.status = status;
  }

  const result = cdtService.getMyCDTs(req.user.id, filterParams);
  return res.status(200).json({ status: 'success', data: result });
}, 'getMyCDTs', 'get-my-cdts');

/**
 * Obtiene un CDT específico por su ID
 * Verifica que el usuario sea propietario o administrador
 * @route GET /api/v1/cdts/:id
 * @access Private (Propietario o Admin)
 * @param {Object} req - Request con params.id
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} CDT solicitado o error 404/403
 */
export const getCDTById = asyncHandler(async (req, res) => {
  const cdt = cdtService.getCDTById(req.params.id, req.user.id, req.user.role);
  return res.status(200).json({ status: 'success', data: { cdt } });
}, 'getCDTById', 'get-cdt-by-id');

export const updateCDT = asyncHandler(async (req, res) => {
  const updatedCDT = cdtService.updateCDT(req.params.id, req.user.id, req.body);
  return res.status(200).json({ status: 'success', data: { cdt: updatedCDT } });
}, 'updateCDT', 'update-cdt');

export const changeStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const updatedCDT = cdtService.changeStatus(
    req.params.id,
    req.user.id,
    req.user.role,
    status,
    reason
  );
  return res.status(200).json({
    status: 'success',
    message: 'Estado del CDT actualizado exitosamente',
    data: { cdt: updatedCDT }
  });
}, 'changeStatus', 'change-status');

export const cancelCDT = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const updatedCDT = cdtService.cancelCDT(
    req.params.id,
    req.user.id,
    req.user.role,
    reason
  );
  return res.status(200).json({
    status: 'success',
    message: 'CDT cancelado exitosamente',
    data: { cdt: updatedCDT }
  });
}, 'cancelCDT', 'cancel-cdt');

export const deleteCDT = asyncHandler(async (req, res) => {
  // SonarQube Fix: Promise wrapper for proper async error handling
  await cdtService.deleteCDT(req.params.id, req.user.id, req.user.role);
  return res.status(204).send();
}, 'deleteCDT', 'delete-cdt');

/**
 * Obtiene todos los CDTs del sistema (solo administradores)
 * Soporta paginación y filtrado por estado y usuario
 * @route GET /api/v1/cdts
 * @access Private (Solo administradores)
 * @param {Object} req - Request con query params (page, limit, status, userId)
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} Lista paginada de todos los CDTs
 */
export const getAllCDTs = asyncHandler(async (req, res) => {
  const { filters } = formatPaginationFilters(req.query);
  const cdts = cdtService.getAllCDTsForAdmin(filters);
  return res.status(200).json({ status: 'success', results: cdts.length, data: { cdts } });
}, 'getAllCDTs', 'get-all-cdts');

/**
 * Obtiene el log de auditoría de un CDT
 * Muestra todas las acciones realizadas sobre el CDT
 * @route GET /api/v1/cdts/:id/audit
 * @access Private (Propietario o Admin)
 * @param {Object} req - Request con params.id
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} Array de logs de auditoría
 */
export const getAuditLog = asyncHandler(async (req, res) => {
  const logs = cdtService.getAuditLog(req.params.id, req.user.id, req.user.role);
  return res.status(200).json({ status: 'success', results: logs.length, data: { logs } });
}, 'getAuditLog', 'get-audit-log');

/**
 * Envía un CDT a revisión (draft -> pending)
 * @route POST /api/v1/cdts/:id/submit
 * @access Private (Usuario propietario del CDT)
 */
export const submitCDT = asyncHandler(async (req, res) => {
  const cdt = cdtService.submitCDTForReview(req.params.id, req.user.id);
  return res.status(200).json({
    status: 'success',
    message: 'CDT enviado a revisión exitosamente',
    data: { cdt }
  });
}, 'submitCDT', 'submit-cdt');

/**
 * Aprueba un CDT (pending -> active) - Solo admin
 * @route POST /api/v1/cdts/:id/approve
 * @access Private (Admin only)
 */
export const approveCDT = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  const cdt = cdtService.approveCDT(req.params.id, req.user.id, adminNotes);
  return res.status(200).json({
    status: 'success',
    message: 'CDT aprobado exitosamente',
    data: { cdt }
  });
}, 'approveCDT', 'approve-cdt');

/**
 * Rechaza un CDT (pending -> rejected) - Solo admin
 * @route POST /api/v1/cdts/:id/reject
 * @access Private (Admin only)
 */
export const rejectCDT = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  if (!adminNotes || adminNotes.trim().length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Debes proporcionar una razón para rechazar el CDT'
    });
  }
  const cdt = cdtService.rejectCDT(req.params.id, req.user.id, adminNotes);
  
  // SonarQube Fix: Handle both Promise and synchronous returns
  if (cdt instanceof Promise) {
    return cdt.then(result => 
      res.status(200).json({
        status: 'success',
        message: 'CDT rechazado',
        data: { cdt: result }
      })
    );
  }
  
  return res.status(200).json({
    status: 'success',
    message: 'CDT rechazado',
    data: { cdt }
  });
}, 'rejectCDT', 'reject-cdt');

/**
 * Cancela un CDT (pending/active -> cancelled)
 * @route POST /api/v1/cdts/:id/cancel
 * @access Private (Usuario propietario o Admin)
 */
export const cancelCDTRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Debes proporcionar una razón para cancelar el CDT'
    });
  }
  const cdt = cdtService.cancelCDT(
    req.params.id,
    req.user.id,
    req.user.role,
    reason
  );
  return res.status(200).json({
    status: 'success',
    message: 'CDT cancelado exitosamente',
    data: { cdt }
  });
}, 'cancelCDTRequest', 'cancel-cdt-request');

/**
 * Obtiene CDTs pendientes de aprobación (admin)
 * @route GET /api/v1/admin/cdts/pending
 * @access Private (Admin only)
 */
export const getPendingCDTs = asyncHandler(async (req, res) => {
  const cdts = cdtService.getPendingCDTs();
  return res.status(200).json({
    status: 'success',
    results: cdts.length,
    data: { cdts }
  });
}, 'getPendingCDTs', 'get-pending-cdts');

/**
 * Obtiene todos los CDTs con filtros (admin)
 * @route GET /api/v1/admin/cdts
 * @access Private (Admin only)
 */
export const getAllCDTsForAdmin = asyncHandler(async (req, res) => {
  // SonarQube Fix: Use Number.parseInt() instead of global parseInt()
  const filters = {
    status: req.query.status,
    userId: req.query.userId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    limit: Number.parseInt(req.query.limit, 10) || 50
  };
  const cdts = cdtService.getAllCDTsForAdmin(filters);
  return res.status(200).json({
    status: 'success',
    results: cdts.length,
    data: { cdts }
  });
}, 'getAllCDTsForAdmin', 'get-all-cdts-admin');

/**
 * Obtiene estadísticas para dashboard de admin
 * @route GET /api/v1/admin/stats
 * @access Private (Admin only)
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const stats = cdtService.getAdminStats();
  return res.status(200).json({
    status: 'success',
    data: { stats }
  });
}, 'getAdminStats', 'get-admin-stats');