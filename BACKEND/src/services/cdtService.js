import CDT from '../models/cdtModel.js';

import cache from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { calculateEndDate, calculateExpectedReturn } from '../config/financialRules.js';

class CDTService {
  createCDT(userId, cdtData) {
    const endDate = calculateEndDate(cdtData.startDate, cdtData.termDays);
    const expectedReturn = calculateExpectedReturn(
      cdtData.amount,
      cdtData.interestRate,
      cdtData.termDays
    );

    const cdtPayload = {
      userId,
      ...cdtData,
      endDate,
      expectedReturn
    };

    const newCDT = CDT.create(cdtPayload);
    CDT.createAuditLog(newCDT.id, 'creado', {
      userId,
      amount: cdtData.amount,
      termDays: cdtData.termDays,
      interestRate: cdtData.interestRate
    });

    cache.invalidatePattern(`cdts:user:${userId}:*`);
    cache.invalidatePattern('cdts:all:*');

    logger.info(`CDT created: ${newCDT.id}`);
    return newCDT;
  }

  getMyCDTs(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      status = undefined
    } = options;

    const cacheKey = `cdts:user:${userId}:status:${status || 'all'}:page:${page}:limit:${limit}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const offset = (page - 1) * limit;
    const query = { userId };

    if (status) {
      query.status = status;
    }

    const cdts = CDT.findAll({
      ...query,
      limit,
      offset
    });

    const total = CDT.count(query);

    const result = {
      cdts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    cache.set(cacheKey, result, 300000);

    return result;
  }

  getCDTById(cdtId, userId, userRole) {
    const cdt = CDT.findById(cdtId);

    if (!cdt) {
      const error = new Error('CDT no encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'admin' && cdt.userId !== userId) {
      const error = new Error('No tienes permiso para ver este CDT');
      error.statusCode = 403;
      throw error;
    }

    return cdt;
  }

  updateCDT(cdtId, userId, updateData) {
    const cdt = CDT.findById(cdtId);

    if (!cdt) {
      const error = new Error('CDT no encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (cdt.userId !== userId) {
      const error = new Error('Solo puedes actualizar tus propios CDTs');
      error.statusCode = 403;
      throw error;
    }

    if (cdt.status !== 'draft') {
      const error = new Error('Solo los CDTs en estado de borrador pueden ser editados');
      error.statusCode = 400;
      throw error;
    }

    // Normalizar datos: convertir camelCase a snake_case y filtrar undefined/null
    const normalizedData = {};
    
    if (updateData.amount !== undefined && updateData.amount !== null) {
      normalizedData.amount = updateData.amount;
    }
    
    // Aceptar tanto termDays (camelCase) como term_days (snake_case)
    const termDaysValue = updateData.termDays ?? updateData.term_days;
    if (termDaysValue !== undefined && termDaysValue !== null) {
      normalizedData.term_days = termDaysValue;
    }
    
    // Aceptar tanto interestRate (camelCase) como interest_rate (snake_case)
    const interestRateValue = updateData.interestRate ?? updateData.interest_rate;
    if (interestRateValue !== undefined && interestRateValue !== null) {
      normalizedData.interest_rate = interestRateValue;
    }
    
    // Aceptar tanto startDate (camelCase) como start_date (snake_case)
    const startDateValue = updateData.startDate ?? updateData.start_date;
    if (startDateValue !== undefined && startDateValue !== null) {
      normalizedData.start_date = startDateValue;
    }
    
    // Aceptar tanto endDate (camelCase) como end_date (snake_case)
    const endDateValue = updateData.endDate ?? updateData.end_date;
    if (endDateValue !== undefined && endDateValue !== null) {
      normalizedData.end_date = endDateValue;
    }
    
    // Aceptar tanto renovationOption (camelCase) como renovation_option (snake_case)
    const renovationOptionValue = updateData.renovationOption ?? updateData.renovation_option;
    if (renovationOptionValue !== undefined && renovationOptionValue !== null) {
      normalizedData.renovation_option = renovationOptionValue;
    }

    // Si no hay campos válidos para actualizar
    if (Object.keys(normalizedData).length === 0) {
      const error = new Error('No se proporcionaron campos válidos para actualizar');
      error.statusCode = 400;
      throw error;
    }

    const updatedCDT = CDT.update(cdtId, normalizedData);
    CDT.createAuditLog(cdtId, 'actualizado', { updateData: normalizedData });

    // Invalidar TODOS los cachés relevantes
    cache.delete(`cdt:${cdtId}`);
    cache.invalidatePattern(`cdts:user:${userId}:*`);
    cache.invalidatePattern('cdts:all:*');
    cache.delete('admin_stats');

    logger.info(`CDT updated: ${cdtId}`);
    return updatedCDT;
  }

  changeStatus(cdtId, userId, userRole, newStatus, reason) {
    const cdt = CDT.findById(cdtId);

    if (!cdt) {
      const error = new Error('CDT no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Check permissions first, especially for admin-only transitions
    if (newStatus === 'active' && userRole !== 'admin') {
      const error = new Error('Solo administradores pueden cambiar el estado a activo');
      error.statusCode = 403;
      throw error;
    }

    if (userRole !== 'admin' && cdt.userId !== userId) {
      const error = new Error('No tienes permiso para cambiar el estado de este CDT');
      error.statusCode = 403;
      throw error;
    }

    const isValidTransition = CDT.validateTransition(cdt.status, newStatus);
    if (!isValidTransition) {
      const error = new Error(`Transición de estado inválida de ${cdt.status} a ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }

    CDT.updateStatus(cdtId, newStatus, reason);
    CDT.createAuditLog(cdtId, 'estado_cambio', { newStatus, reason });

    // Invalidar TODOS los cachés relevantes
    cache.delete(`cdt:${cdtId}`);
    cache.invalidatePattern(`cdts:user:${cdt.userId}:*`);
    cache.invalidatePattern('cdts:all:*');
    cache.delete('admin_stats');
    cache.delete('pending_cdts');

    const updatedCDT = CDT.findById(cdtId);

    logger.info(`CDT status changed: ${cdtId} from ${cdt.status} to ${newStatus}`);
    return updatedCDT;
  }

  cancelCDT(cdtId, userId, userRole, reason) {
    if (!reason || reason.trim() === '') {
      const error = new Error('Debes proporcionar una razón para cancelar el CDT');
      error.statusCode = 400;
      // SonarQube Fix: Return Promise for error handling in async contexts
      return Promise.reject(error);
    }

    const cancelledCDT = CDT.cancel(cdtId, userId, userRole, reason);

    // Invalidar TODOS los cachés relevantes
    cache.delete(`cdt:${cdtId}`);
    cache.delete('user_cdts_' + userId);
    cache.delete('all_cdts');
    cache.delete('pending_cdts');
    cache.delete('admin_stats');
    cache.invalidatePattern(`cdts:user:${userId}:*`);
    cache.invalidatePattern('cdts:all:*');

    logger.info(`CDT cancelled: ${cdtId}`);
    return cancelledCDT;
  }

  deleteCDT(cdtId, userId, userRole) {
    return Promise.resolve().then(() => {
      const cdt = CDT.findById(cdtId);

      if (!cdt) {
        const error = new Error('CDT no encontrado');
        error.statusCode = 404;
        throw error;
      }

      if (userRole !== 'admin' && cdt.userId !== userId) {
        const error = new Error('No tienes permiso para eliminar este CDT');
        error.statusCode = 403;
        throw error;
      }

      if (!['draft', 'cancelled'].includes(cdt.status)) {
        const error = new Error('Solo puedes eliminar CDTs en estado de borrador o cancelado');
        error.statusCode = 400;
        throw error;
      }

      // Create audit log before deletion
      try {
        CDT.createAuditLog(cdtId, 'eliminado', {});
      } catch (auditError) {
        logger.warn(`Could not create audit log for CDT ${cdtId}: ${auditError.message}`);
      }

      CDT.deleteById(cdtId);

      // Invalidar TODOS los cachés relevantes
      cache.delete(`cdt:${cdtId}`);
      cache.invalidatePattern(`cdts:user:${cdt.userId}:*`);
      cache.invalidatePattern('cdts:all:*');
      cache.delete('admin_stats');
      cache.delete('pending_cdts');

      logger.info(`CDT deleted: ${cdtId}`);
    });
  }

  submitCDTForReview(cdtId, userId) {
    const submittedCDT = CDT.submitForReview(cdtId, userId);

    // Invalidar TODOS los cachés relevantes
    cache.delete(`cdt:${cdtId}`);
    cache.delete('user_cdts_' + userId);
    cache.invalidatePattern(`cdts:user:${userId}:*`);
    cache.invalidatePattern('cdts:all:*');
    cache.delete('pending_cdts');
    cache.delete('admin_stats');

    logger.info(`CDT submitted for review: ${cdtId}`);
    return submittedCDT;
  }

  approveCDT(cdtId, adminId, notes) {
    const approvedCDT = CDT.approve(cdtId, adminId, notes);

    // Invalidar TODOS los cachés relevantes
    if (approvedCDT?.userId) {
      cache.delete(`cdt:${cdtId}`);
      cache.invalidatePattern(`cdts:user:${approvedCDT.userId}:*`);
      cache.invalidatePattern('cdts:all:*');
      cache.delete('pending_cdts');
      cache.delete('admin_stats');
    }

    logger.info(`CDT approved: ${cdtId}`);
    return approvedCDT;
  }

  rejectCDT(cdtId, adminId, rejectionNotes) {
    if (!rejectionNotes || rejectionNotes.trim() === '') {
      const error = new Error('Debes proporcionar una razón para rechazar el CDT');
      error.statusCode = 400;
      // SonarQube Fix: Return Promise for error handling in async contexts
      return Promise.reject(error);
    }

    const rejectedCDT = CDT.reject(cdtId, adminId, rejectionNotes);

    // Invalidar TODOS los cachés relevantes
    if (rejectedCDT?.userId) {
      cache.delete(`cdt:${cdtId}`);
      cache.invalidatePattern(`cdts:user:${rejectedCDT.userId}:*`);
      cache.invalidatePattern('cdts:all:*');
      cache.delete('pending_cdts');
      cache.delete('admin_stats');
    }

    logger.info(`CDT rejected: ${cdtId}`);
    return rejectedCDT;
  }

  getAdminStats() {
    const cachedStats = cache.get('admin_stats');
    if (cachedStats) {
      return cachedStats;
    }

    const totalCDTs = CDT.count({});
    const draftCount = CDT.count({ status: 'draft' });
    const pendingCount = CDT.count({ status: 'pending' });
    const activeCount = CDT.count({ status: 'active' });
    const completedCount = CDT.count({ status: 'completed' });
    const rejectedCount = CDT.count({ status: 'rejected' });
    const cancelledCount = CDT.count({ status: 'cancelled' });

    const activeCDTs = CDT.findByStatus('active');

    let totalInvested = 0;
    let totalEstimatedReturn = 0;

    if (Array.isArray(activeCDTs)) {
      for (const cdt of activeCDTs) {
        totalInvested += cdt.amount || 0;
        totalEstimatedReturn += cdt.estimatedReturn || 0;
      }
    }

    const stats = {
      totalCDTs,
      byStatus: {
        draft: draftCount,
        pending: pendingCount,
        active: activeCount,
        completed: completedCount,
        rejected: rejectedCount,
        cancelled: cancelledCount
      },
      financial: {
        totalInvested,
        totalEstimatedReturn,
        activeCDTsCount: activeCount
      }
    };

    cache.set('admin_stats', stats, 600000);

    logger.info('Admin stats calculated');
    return stats;
  }

  getAuditLog(cdtId, userId, userRole) {
    const cdt = CDT.findById(cdtId);

    if (!cdt) {
      const error = new Error('CDT no encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'admin' && cdt.userId !== userId) {
      const error = new Error('No tienes permiso para ver este registro de auditoría');
      error.statusCode = 403;
      throw error;
    }

    const auditLog = CDT.getAuditLogs(cdtId);

    logger.info(`Audit log retrieved for CDT: ${cdtId}`);
    return auditLog;
  }

  getAllCDTsForAdmin(filters = {}) {
    const cdts = CDT.findAllForAdmin(filters);

    logger.info('Admin fetched all CDTs with filters');
    return cdts;
  }

  getPendingCDTs() {
    const cachedPending = cache.get('pending_cdts');

    if (cachedPending) {
      return cachedPending;
    }

    const pendingCDTs = CDT.findAllForAdmin({ status: 'pending' });

    cache.set('pending_cdts', pendingCDTs, 60000);

    logger.info('Pending CDTs fetched');
    return pendingCDTs;
  }
}

const cdtService = new CDTService();
export default cdtService;
