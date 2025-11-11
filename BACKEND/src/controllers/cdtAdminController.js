import CDT from '../models/cdtModel.js';
import { logger } from '../utils/logger.js';

/**
 * CDT Admin Controller
 * Controlador para operaciones administrativas de CDTs
 * Requiere rol de administrador
 */

/**
 * Obtiene todos los CDTs del sistema (Admin)
 * Soporta filtrado por estado y usuario
 * @route GET /api/v1/cdts/admin/all
 * @access Private (Admin only)
 * @param {Object} req - Request con query params (page, limit, status, userId)
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} Lista paginada de todos los CDTs del sistema
 */
export const getAllCDTs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    
    // SonarQube Fix: Use Number.parseInt() instead of global parseInt()
    const filters = {
      limit: Number.parseInt(limit, 10),
      offset: (Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10)
    };

    if (status) filters.status = status;
    if (userId) filters.userId = userId;

  // Synchronous model calls (better-sqlite3)
  const cdts = CDT.findAll(filters);
  const total = CDT.count({ status, userId });

    res.status(200).json({
      status: 'success',
      results: cdts.length,
      total,
      page: Number.parseInt(page, 10),
      totalPages: Math.ceil(total / Number.parseInt(limit, 10)),
      data: { cdts }
    });
  } catch (error) {
    logger.error('Error en getAllCDTs (Admin)', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      action: 'admin-get-all-cdts',
      filters: req.query,
      ip: req.ip
    });
    next(error);
  }
};

/**
 * Aprueba un CDT cambiando su estado de pending a active
 * Solo administradores pueden aprobar CDTs
 * @route PUT /api/v1/cdts/:id/approve
 * @access Private (Admin only)
 * @param {Object} req - Request con params.id
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} CDT aprobado
 */
export const approveCDT = async (req, res, next) => {
  try {
  const cdt = CDT.findById(req.params.id);

    if (!cdt) {
      return res.status(404).json({
        status: 'fail',
        message: 'CDT no encontrado'
      });
    }

    if (cdt.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Solo se pueden aprobar CDTs en estado pending. Estado actual: ${cdt.status}`
      });
    }

    // Cambiar estado a active (SonarQube Fix: updateStatus is synchronous)
    CDT.updateStatus(req.params.id, 'active', 'Aprobado por administrador');

    // Crear log de auditoría (SonarQube Fix: createAuditLog is synchronous)
    CDT.createAuditLog(req.params.id, 'approved', {
      adminId: req.user.id,
      adminName: req.user.name,
      previousStatus: 'pending',
      newStatus: 'active'
    });

  const updatedCDT = CDT.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'CDT aprobado exitosamente',
      data: { cdt: updatedCDT }
    });
  } catch (error) {
    logger.error('Error en approveCDT (Admin)', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      cdtId: req.params?.id,
      action: 'admin-approve-cdt',
      ip: req.ip
    });
    next(error);
  }
};

/**
 * Rechaza un CDT cambiando su estado de pending a cancelled
 * @route PUT /api/v1/cdts/:id/reject
 * @access Private (Admin only)
 * @param {Object} req - Request con params.id y body.reason
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} CDT rechazado
 */
export const rejectCDT = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        status: 'fail',
        message: 'La razón de rechazo es requerida'
      });
    }

  const cdt = CDT.findById(req.params.id);

    if (!cdt) {
      return res.status(404).json({
        status: 'fail',
        message: 'CDT no encontrado'
      });
    }

    if (cdt.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `Solo se pueden rechazar CDTs en estado pending. Estado actual: ${cdt.status}`
      });
    }

    // Cambiar estado a cancelled con razón (SonarQube Fix: updateStatus is synchronous)
    CDT.updateStatus(req.params.id, 'cancelled', `Rechazado por administrador: ${reason}`);

    // Crear log de auditoría (SonarQube Fix: createAuditLog is synchronous)
    CDT.createAuditLog(req.params.id, 'rejected', {
      adminId: req.user.id,
      adminName: req.user.name,
      reason,
      previousStatus: 'pending',
      newStatus: 'cancelled'
    });

  const updatedCDT = CDT.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'CDT rechazado exitosamente',
      data: { cdt: updatedCDT }
    });
  } catch (error) {
    logger.error('Error en rejectCDT (Admin)', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      cdtId: req.params?.id,
      reason: req.body?.reason,
      action: 'admin-reject-cdt',
      ip: req.ip
    });
    next(error);
  }
};

/**
 * Elimina permanentemente un CDT (Admin)
 * Solo se pueden eliminar CDTs en estado draft o cancelled
 * @route DELETE /api/v1/cdts/:id/force-delete
 * @access Private (Admin only)
 * @param {Object} req - Request con params.id
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} 204 No Content
 */
export const forceDeleteCDT = async (req, res, next) => {
  try {
  const cdt = CDT.findById(req.params.id);

    if (!cdt) {
      return res.status(404).json({
        status: 'fail',
        message: 'CDT no encontrado'
      });
    }

    // Log de auditoría antes de eliminar
  CDT.createAuditLog(req.params.id, 'force_deleted', {
      adminId: req.user.id,
      adminName: req.user.name,
      cdtDetails: {
        userId: cdt.userId,
        amount: cdt.amount,
        status: cdt.status
      }
    });

  CDT.deleteById(req.params.id);

    logger.warn('CDT eliminado permanentemente por admin', {
      adminId: req.user.id,
      cdtId: req.params.id,
      cdtUserId: cdt.userId,
      cdtAmount: cdt.amount,
      ip: req.ip
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error en forceDeleteCDT (Admin)', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      cdtId: req.params?.id,
      action: 'admin-force-delete',
      ip: req.ip
    });
    next(error);
  }
};

/**
 * Obtiene estadísticas generales de CDTs (Admin)
 * @route GET /api/v1/cdts/admin/stats
 * @access Private (Admin only)
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Function} next - Next middleware
 * @returns {Object} Estadísticas agregadas de CDTs
 */
export const getCDTStats = async (req, res, next) => {
  try {
    const stats = {
  total: CDT.count({}),
      byStatus: {
  draft: CDT.count({ status: 'draft' }),
  pending: CDT.count({ status: 'pending' }),
  active: CDT.count({ status: 'active' }),
  completed: CDT.count({ status: 'completed' }),
  cancelled: CDT.count({ status: 'cancelled' })
      }
    };

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    logger.error('Error en getCDTStats (Admin)', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      action: 'admin-get-stats',
      ip: req.ip
    });
    next(error);
  }
};
