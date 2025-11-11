import { jest } from '@jest/globals';

// Mocks antes de imports
const mockCDT = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  deleteById: jest.fn(),
  count: jest.fn(),
  createAuditLog: jest.fn(),
  getAuditLogs: jest.fn(),
  validateTransition: jest.fn(),
  cancel: jest.fn(),
  submitForReview: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
  getStats: jest.fn(),
  findByStatus: jest.fn(),
  findAllForAdmin: jest.fn()
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  invalidatePattern: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

jest.unstable_mockModule('../../src/models/cdtModel.js', () => ({
  default: mockCDT
}));

jest.unstable_mockModule('../../src/utils/cache.js', () => ({
  default: mockCache
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  logger: mockLogger
}));

const cdtService = (await import('../../src/services/cdtService.js')).default;
const CDT = mockCDT;
const cache = mockCache;
const logger = mockLogger;

describe('cdtService - Comprehensive Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockReturnValue(null);
    cache.set.mockReturnValue(true);
    cache.delete.mockReturnValue(true);
    cache.invalidatePattern.mockReturnValue(5);
  });

  describe('createCDT', () => {
    it('should create CDT with calculated end date and audit log', async () => {
      const userId = 'user-123';
      const cdtData = {
        amount: 1000000,
        termDays: 90,
        interestRate: 5.5,
        startDate: '2025-01-01',
        renovationOption: 'capital_interest'
      };

      const mockCDTObj = {
        id: 'cdt-123',
        userId,
        ...cdtData,
        endDate: '2025-04-01',
        status: 'draft',
        expectedReturn: 13750
      };

      CDT.create.mockReturnValueOnce(mockCDTObj);
      CDT.createAuditLog.mockReturnValueOnce(true);

      const result = cdtService.createCDT(userId, cdtData);

      expect(CDT.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          amount: 1000000,
          termDays: 90,
          interestRate: 5.5,
          renovationOption: 'capital_interest'
        })
      );

      expect(CDT.createAuditLog).toHaveBeenCalledWith('cdt-123', 'creado', {
        userId,
        amount: 1000000,
        termDays: 90,
        interestRate: 5.5
      });

      expect(cache.invalidatePattern).toHaveBeenCalledWith(`cdts:user:${userId}:*`);
      expect(cache.invalidatePattern).toHaveBeenCalledWith('cdts:all:*');
      expect(result).toEqual(mockCDTObj);
    });

    it('should handle CDT creation without renovation option', async () => {
      const cdtData = {
        amount: 5000000,
        termDays: 180,
        interestRate: 6.0,
        startDate: '2025-02-01'
      };

      const mockCDT = { id: 'cdt-456', ...cdtData, endDate: '2025-08-01' };
      CDT.create.mockReturnValueOnce(mockCDT);
      CDT.createAuditLog.mockReturnValueOnce(true);

      const result = cdtService.createCDT('user-456', cdtData);

      expect(result).toBeDefined();
      expect(CDT.create).toHaveBeenCalled();
    });

    it('should throw error when CDT creation fails', async () => {
      const cdtData = {
        amount: 1000000,
        termDays: 90,
        interestRate: 5.5,
        startDate: '2025-01-01'
      };

      CDT.create.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      expect(() => cdtService.createCDT('user-789', cdtData)).toThrow('Database error');
      expect(CDT.createAuditLog).not.toHaveBeenCalled();
    });
  });

  describe('getMyCDTs', () => {
    it('should return cached CDTs when available', async () => {
      const userId = 'user-123';
      const cachedData = {
        cdts: [{ id: 'cdt-1' }, { id: 'cdt-2' }],
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
      };

      cache.get.mockReturnValueOnce(cachedData);

      const result = cdtService.getMyCDTs(userId);

      expect(cache.get).toHaveBeenCalledWith('cdts:user:user-123:status:all:page:1:limit:10');
      expect(CDT.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch CDTs from database when not cached', async () => {
      const userId = 'user-456';
      const mockCDTs = [
        { id: 'cdt-1', amount: 1000000 },
        { id: 'cdt-2', amount: 2000000 }
      ];

      cache.get.mockReturnValueOnce(null);
      CDT.findAll.mockReturnValueOnce(mockCDTs);
      CDT.count.mockReturnValueOnce(2);

      const result = cdtService.getMyCDTs(userId, { page: 1, limit: 10 });

      expect(CDT.findAll).toHaveBeenCalledWith({
        userId: 'user-456',
        limit: 10,
        offset: 0
      });

      expect(CDT.count).toHaveBeenCalledWith({ userId: 'user-456', status: undefined });
      expect(cache.set).toHaveBeenCalled();
      expect(result.cdts).toEqual(mockCDTs);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter CDTs by status', async () => {
      const userId = 'user-789';
      cache.get.mockReturnValueOnce(null);
      CDT.findAll.mockReturnValueOnce([{ id: 'cdt-1', status: 'active' }]);
      CDT.count.mockReturnValueOnce(1);

      cdtService.getMyCDTs(userId, { status: 'active', page: 2, limit: 5 });

      expect(CDT.findAll).toHaveBeenCalledWith({
        userId: 'user-789',
        status: 'active',
        limit: 5,
        offset: 5
      });

      expect(CDT.count).toHaveBeenCalledWith({ userId: 'user-789', status: 'active' });
    });

    it('should handle pagination correctly', async () => {
      cache.get.mockReturnValueOnce(null);
      CDT.findAll.mockReturnValueOnce([{ id: 'cdt-1' }]);
      CDT.count.mockReturnValueOnce(25);

      const result = cdtService.getMyCDTs('user-123', { page: 3, limit: 10 });

      expect(CDT.findAll).toHaveBeenCalledWith({
        userId: 'user-123',
        limit: 10,
        offset: 20
      });

      expect(result.pagination).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3
      });
    });
  });

  describe('getCDTById', () => {
    it('should return CDT when user is owner', async () => {
      const mockCDT = { id: 'cdt-123', userId: 'user-123', amount: 1000000 };
      CDT.findById.mockReturnValueOnce(mockCDT);

      const result = cdtService.getCDTById('cdt-123', 'user-123', 'user');

      expect(CDT.findById).toHaveBeenCalledWith('cdt-123');
      expect(result).toEqual(mockCDT);
    });

    it('should return CDT when user is admin', async () => {
      const mockCDT = { id: 'cdt-456', userId: 'user-456', amount: 2000000 };
      CDT.findById.mockReturnValueOnce(mockCDT);

      const result = cdtService.getCDTById('cdt-456', 'admin-123', 'admin');

      expect(result).toEqual(mockCDT);
    });

    it('should throw 404 when CDT not found', async () => {
      CDT.findById.mockReturnValueOnce(null);

      const error = new Error('CDT no encontrado');
      error.statusCode = 404;

      expect(() => cdtService.getCDTById('cdt-999', 'user-123', 'user')).toThrow('CDT no encontrado');
    });

    it('should throw 403 when user is not owner and not admin', async () => {
      const mockCDT = { id: 'cdt-789', userId: 'user-789', amount: 3000000 };
      CDT.findById.mockReturnValueOnce(mockCDT);

      expect(() => cdtService.getCDTById('cdt-789', 'user-999', 'user')).toThrow('No tienes permiso para ver este CDT');
    });
  });

  describe('updateCDT', () => {
    it('should update CDT in draft status', async () => {
      const mockCDT = { id: 'cdt-123', userId: 'user-123', status: 'draft', amount: 1000000, termDays: 90 };
      const updateData = { amount: 1500000, termDays: 120 };
      const updatedCDT = { ...mockCDT, amount: 1500000, term_days: 120 };

      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.update.mockReturnValueOnce(updatedCDT);
      CDT.createAuditLog.mockReturnValueOnce(true);

      const result = cdtService.updateCDT('cdt-123', 'user-123', updateData);

      expect(CDT.update).toHaveBeenCalledWith('cdt-123', expect.objectContaining({
        amount: 1500000,
        term_days: 120
      }));
      expect(CDT.createAuditLog).toHaveBeenCalled();
      expect(cache.delete).toHaveBeenCalledWith('cdt:cdt-123');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('cdts:user:user-123:*');
      expect(result).toEqual(updatedCDT);
    });

    it('should not update CDT in pending status', async () => {
      const mockCDT = { id: 'cdt-456', userId: 'user-456', status: 'pending', amount: 2000000 };
      CDT.findById.mockReturnValueOnce(mockCDT);

      expect(() => cdtService.updateCDT('cdt-456', 'user-456', { amount: 2500000 })).toThrow('Solo los CDTs en estado de borrador pueden ser editados');
    });

    it('should throw 404 when CDT not found', async () => {
      CDT.findById.mockReturnValueOnce(null);

      expect(() => cdtService.updateCDT('cdt-999', 'user-123', {})).toThrow('CDT no encontrado');
    });

    it('should throw 403 when user is not owner', async () => {
      const mockCDT = { id: 'cdt-789', userId: 'user-789', status: 'draft' };
      CDT.findById.mockReturnValueOnce(mockCDT);

      expect(() => cdtService.updateCDT('cdt-789', 'user-999', {})).toThrow('Solo puedes actualizar tus propios CDTs');
    });

    it('should throw 400 when CDT is not editable', async () => {
      const mockCDT = { id: 'cdt-123', userId: 'user-123', status: 'active' };
      CDT.findById.mockReturnValueOnce(mockCDT);

      expect(() => cdtService.updateCDT('cdt-123', 'user-123', {})).toThrow('Solo los CDTs en estado de borrador pueden ser editados');
    });
  });

  describe('changeStatus', () => {
    it('should change status from draft to pending', async () => {
      const mockCDT = { id: 'cdt-123', userId: 'user-123', status: 'draft' };
      const updatedCDT = { ...mockCDT, status: 'pending' };

      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.findById.mockReturnValueOnce(updatedCDT);
      CDT.validateTransition.mockReturnValueOnce(true);
      CDT.updateStatus.mockReturnValueOnce(true);

      const result = cdtService.changeStatus('cdt-123', 'user-123', 'user', 'pending');

      expect(CDT.validateTransition).toHaveBeenCalledWith('draft', 'pending');
      expect(CDT.updateStatus).toHaveBeenCalledWith('cdt-123', 'pending', undefined);
      expect(result).toEqual(updatedCDT);
    });

    it('should throw 400 when transition is invalid', () => {
      const mockCDT = { id: 'cdt-456', userId: 'user-456', status: 'completed' };
      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.validateTransition.mockReturnValueOnce(false);

      expect(() => {
        cdtService.changeStatus('cdt-456', 'user-456', 'user', 'draft');
      }).toThrow('Transición de estado inválida de completed a draft');
    });

    it('should invalidate cache after status change', async () => {
      const mockCDT = { id: 'cdt-789', userId: 'user-789', status: 'pending' };
      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.findById.mockReturnValueOnce({ ...mockCDT, status: 'cancelled' });
      CDT.validateTransition.mockReturnValueOnce(true);
      CDT.updateStatus.mockReturnValueOnce(true);

      cdtService.changeStatus('cdt-789', 'user-789', 'user', 'cancelled', 'Usuario canceló');

      expect(cache.delete).toHaveBeenCalledWith('cdt:cdt-789');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('cdts:user:user-789:*');
    });
  });

  describe('cancelCDT', () => {
    it('should cancel CDT with reason', async () => {
      const cancelledCDT = { id: 'cdt-123', userId: 'user-123', status: 'cancelled' };

      CDT.cancel.mockReturnValueOnce(cancelledCDT);

      const result = cdtService.cancelCDT('cdt-123', 'user-123', 'user', 'Cambio de planes');

      expect(CDT.cancel).toHaveBeenCalledWith('cdt-123', 'user-123', 'user', 'Cambio de planes');
      expect(cache.delete).toHaveBeenCalledWith('user_cdts_user-123');
      expect(cache.delete).toHaveBeenCalledWith('all_cdts');
      expect(result).toEqual(cancelledCDT);
    });

    it('should allow admin to cancel any CDT', async () => {
      const cancelledCDT = { id: 'cdt-456', userId: 'user-456', status: 'cancelled' };
      CDT.cancel.mockReturnValueOnce(cancelledCDT);

      cdtService.cancelCDT('cdt-456', 'admin-123', 'admin', 'Revisión administrativa');

      expect(CDT.cancel).toHaveBeenCalledWith('cdt-456', 'admin-123', 'admin', 'Revisión administrativa');
      expect(cache.delete).toHaveBeenCalledWith('pending_cdts');
    });

    it('should throw 400 when no reason provided', async () => {
      await expect(
        cdtService.cancelCDT('cdt-789', 'user-789', 'user', '')
      ).rejects.toMatchObject({
        message: 'Debes proporcionar una razón para cancelar el CDT',
        statusCode: 400
      });
    });

    it('should handle model validation errors', async () => {
      const error = new Error('No tienes permisos para cancelar este CDT');
      CDT.cancel.mockRejectedValueOnce(error);

      await expect(
        cdtService.cancelCDT('cdt-123', 'user-999', 'user', 'Reason')
      ).rejects.toThrow('No tienes permisos para cancelar este CDT');
    });

    it('should handle status validation errors from model', async () => {
      const error = new Error("No puedes cancelar un CDT con estado 'completed'");
      CDT.cancel.mockRejectedValueOnce(error);

      await expect(
        cdtService.cancelCDT('cdt-456', 'user-456', 'user', 'Reason')
      ).rejects.toThrow("No puedes cancelar un CDT con estado 'completed'");
    });
  });

  describe('deleteCDT', () => {
    it('should delete draft CDT', async () => {
      const mockCDT = { id: 'cdt-123', userId: 'user-123', status: 'draft' };
      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.deleteById.mockReturnValueOnce(true);

      await cdtService.deleteCDT('cdt-123', 'user-123', 'user');

      expect(CDT.deleteById).toHaveBeenCalledWith('cdt-123');
      expect(cache.delete).toHaveBeenCalledWith('cdt:cdt-123');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('cdts:user:user-123:*');
    });

    it('should delete cancelled CDT', async () => {
      const mockCDT = { id: 'cdt-456', userId: 'user-456', status: 'cancelled' };
      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.deleteById.mockReturnValueOnce(true);

      await cdtService.deleteCDT('cdt-456', 'user-456', 'user');

      expect(CDT.deleteById).toHaveBeenCalledWith('cdt-456');
    });
  });

  describe('submitCDTForReview', () => {
    it('should submit draft CDT for review', async () => {
      const submittedCDT = { id: 'cdt-123', userId: 'user-123', status: 'pending' };

      CDT.submitForReview.mockReturnValueOnce(submittedCDT);

      const result = cdtService.submitCDTForReview('cdt-123', 'user-123');

      expect(CDT.submitForReview).toHaveBeenCalledWith('cdt-123', 'user-123');
      expect(cache.delete).toHaveBeenCalledWith('cdt:cdt-123');
      expect(cache.delete).toHaveBeenCalledWith('user_cdts_user-123');
      expect(result).toEqual(submittedCDT);
    });

    it('should handle model validation errors', async () => {
      const error = new Error('Solo puedes enviar a revisión CDTs en estado draft');
      CDT.submitForReview.mockRejectedValueOnce(error);

      await expect(
        cdtService.submitCDTForReview('cdt-456', 'user-456')
      ).rejects.toThrow('Solo puedes enviar a revisión CDTs en estado draft');
    });

    it('should handle permission errors', async () => {
      const error = new Error('No tienes permiso para enviar este CDT a revisión');
      CDT.submitForReview.mockRejectedValueOnce(error);

      await expect(
        cdtService.submitCDTForReview('cdt-789', 'user-999')
      ).rejects.toThrow('No tienes permiso para enviar este CDT a revisión');
    });
  });

  describe('approveCDT', () => {
    it('should approve pending CDT', async () => {
      const approvedCDT = { id: 'cdt-123', userId: 'user-123', status: 'active' };

      CDT.approve.mockReturnValueOnce(approvedCDT);

      const result = cdtService.approveCDT('cdt-123', 'admin-789', 'Aprobado sin observaciones');

      expect(CDT.approve).toHaveBeenCalledWith('cdt-123', 'admin-789', 'Aprobado sin observaciones');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('cdts:user:user-123:*');
      expect(result).toEqual(approvedCDT);
    });

    it('should handle model validation errors', async () => {
      const error = new Error('Solo puedes aprobar CDTs en estado pending');
      CDT.approve.mockRejectedValueOnce(error);

      await expect(
        cdtService.approveCDT('cdt-456', 'admin-123', null)
      ).rejects.toThrow('Solo puedes aprobar CDTs en estado pending');
    });
  });

  describe('rejectCDT', () => {
    it('should reject pending CDT with notes', async () => {
      const rejectedCDT = { id: 'cdt-123', userId: 'user-123', status: 'rejected' };

      CDT.reject.mockReturnValueOnce(rejectedCDT);

      const result = cdtService.rejectCDT('cdt-123', 'admin-456', 'Documentación incompleta');

      expect(CDT.reject).toHaveBeenCalledWith('cdt-123', 'admin-456', 'Documentación incompleta');
      expect(cache.invalidatePattern).toHaveBeenCalledWith('cdts:user:user-123:*');
      expect(result).toEqual(rejectedCDT);
    });

    it('should throw 400 when rejection notes are missing', async () => {
      await expect(
        cdtService.rejectCDT('cdt-456', 'admin-123', '')
      ).rejects.toMatchObject({
        message: 'Debes proporcionar una razón para rechazar el CDT',
        statusCode: 400
      });
    });
  });

  describe('getAdminStats', () => {
    it('should return aggregated CDT statistics from cache', async () => {
      const mockStats = {
        totalCDTs: 150,
        byStatus: {
          draft: 10,
          pending: 5,
          active: 120,
          completed: 10,
          rejected: 3,
          cancelled: 2
        },
        financial: {
          totalInvested: 15000000,
          totalEstimatedReturn: 1500000,
          activeCDTsCount: 120
        }
      };

      cache.get.mockReturnValueOnce(mockStats);

      const result = cdtService.getAdminStats();

      expect(cache.get).toHaveBeenCalledWith('admin_stats');
      expect(result).toEqual(mockStats);
    });

    it('should calculate stats when cache is empty', async () => {
      cache.get.mockReturnValueOnce(null);
      CDT.count.mockReturnValueOnce(150); // total
      CDT.count.mockReturnValueOnce(5);   // pending
      CDT.count.mockReturnValueOnce(120); // active
      CDT.count.mockReturnValueOnce(10);  // completed
      CDT.count.mockReturnValueOnce(3);   // rejected
      CDT.count.mockReturnValueOnce(2);   // cancelled
      CDT.count.mockReturnValueOnce(10);  // draft
      CDT.findByStatus.mockReturnValueOnce([
        { amount: 1000000, estimatedReturn: 50000 },
        { amount: 2000000, estimatedReturn: 100000 }
      ]);

      const result = cdtService.getAdminStats();

      expect(CDT.findByStatus).toHaveBeenCalledWith('active');
      expect(result.totalCDTs).toBe(150);
      expect(result.financial.totalInvested).toBe(3000000);
    });
  });

  describe('getAuditLog', () => {
    it('should return audit log for CDT owner', async () => {
      const mockCDT = { id: 'cdt-123', userId: 'user-123' };
      const mockAuditLog = [
        { action: 'creado', timestamp: '2025-01-01T00:00:00Z' },
        { action: 'actualizado', timestamp: '2025-01-02T00:00:00Z' }
      ];

      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.getAuditLogs.mockReturnValueOnce(mockAuditLog);

      const result = cdtService.getAuditLog('cdt-123', 'user-123', 'user');

      expect(CDT.getAuditLogs).toHaveBeenCalledWith('cdt-123');
      expect(result).toEqual(mockAuditLog);
    });

    it('should allow admin to view any audit log', async () => {
      const mockCDT = { id: 'cdt-456', userId: 'user-456' };
      const mockAuditLog = [{ action: 'creado', timestamp: '2025-01-01T00:00:00Z' }];

      CDT.findById.mockReturnValueOnce(mockCDT);
      CDT.getAuditLogs.mockReturnValueOnce(mockAuditLog);

      cdtService.getAuditLog('cdt-456', 'admin-123', 'admin');

      expect(CDT.getAuditLogs).toHaveBeenCalled();
    });

    it('should throw 403 when non-owner tries to view audit log', () => {
      const mockCDT = { id: 'cdt-789', userId: 'user-789' };
      CDT.findById.mockReturnValueOnce(mockCDT);

      expect(() =>
        cdtService.getAuditLog('cdt-789', 'user-999', 'user')
      ).toThrow('No tienes permiso para ver este registro de auditoría');
    });
  });

  describe('getAllCDTsForAdmin', () => {
    it('should return all CDTs with filters for admin', async () => {
      const mockCDTs = [
        { id: 'cdt-1', status: 'active', amount: 1000000 },
        { id: 'cdt-2', status: 'pending', amount: 2000000 }
      ];

      CDT.findAllForAdmin.mockReturnValueOnce(mockCDTs);

      const result = cdtService.getAllCDTsForAdmin({ status: 'active' });

      expect(CDT.findAllForAdmin).toHaveBeenCalledWith({ status: 'active' });
      expect(result).toEqual(mockCDTs);
    });

    it('should filter by userId when provided', async () => {
      CDT.findAllForAdmin.mockReturnValueOnce([{ id: 'cdt-1', userId: 'user-123' }]);

      cdtService.getAllCDTsForAdmin({ userId: 'user-123' });

      expect(CDT.findAllForAdmin).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });

  describe('getPendingCDTs', () => {
    it('should return only pending CDTs from cache', async () => {
      const mockPendingCDTs = [
        { id: 'cdt-1', status: 'pending', amount: 1000000 },
        { id: 'cdt-2', status: 'pending', amount: 2000000 }
      ];

      cache.get.mockReturnValueOnce(mockPendingCDTs);

      const result = cdtService.getPendingCDTs();

      expect(cache.get).toHaveBeenCalledWith('pending_cdts');
      expect(result).toEqual(mockPendingCDTs);
    });

    it('should fetch from DB when cache is empty', async () => {
      const mockPendingCDTs = [{ id: 'cdt-1', status: 'pending', amount: 1000000 }];
      
      cache.get.mockReturnValueOnce(null);
      CDT.findAllForAdmin.mockReturnValueOnce(mockPendingCDTs);

      const result = cdtService.getPendingCDTs();

      expect(CDT.findAllForAdmin).toHaveBeenCalledWith({ status: 'pending' });
      expect(cache.set).toHaveBeenCalledWith('pending_cdts', mockPendingCDTs, 60000);
      expect(result).toEqual(mockPendingCDTs);
    });
  });
});
