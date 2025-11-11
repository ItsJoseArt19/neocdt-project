import { jest } from '@jest/globals';

const mockCdtModel = {
  findAll: jest.fn(),
  count: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
  createAuditLog: jest.fn(),
  deleteById: jest.fn()
};

const mockLogger = {
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};

const noop = jest.fn();

jest.unstable_mockModule('../../src/models/cdtModel.js', () => ({
  __esModule: true,
  default: mockCdtModel
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: mockLogger,
  logDatabase: noop
}));

let getAllCDTs, approveCDT, rejectCDT, forceDeleteCDT, getCDTStats;

beforeAll(async () => {
  const controller = await import('../../src/controllers/cdtAdminController.js');
  getAllCDTs = controller.getAllCDTs;
  approveCDT = controller.approveCDT;
  rejectCDT = controller.rejectCDT;
  forceDeleteCDT = controller.forceDeleteCDT;
  getCDTStats = controller.getCDTStats;
});

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('cdtAdminController - complete coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCDTs', () => {
    it('should get all CDTs with pagination', async () => {
      const req = {
        query: { page: '1', limit: '20' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

      const mockCdts = [
        { id: 'cdt-1', amount: 5000000, status: 'active' },
        { id: 'cdt-2', amount: 3000000, status: 'pending' }
      ];

  // Synchronous model layer: use mockReturnValueOnce instead of mockResolvedValueOnce
  mockCdtModel.findAll.mockReturnValueOnce(mockCdts);
  mockCdtModel.count.mockReturnValueOnce(2);

      await getAllCDTs(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        results: 2,
        total: 2
      }));
    });

    it('should filter by status', async () => {
      const req = {
        query: { page: '1', limit: '20', status: 'pending' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.findAll.mockReturnValueOnce([]);
  mockCdtModel.count.mockReturnValueOnce(0);

      await getAllCDTs(req, res, next);

      expect(mockCdtModel.findAll).toHaveBeenCalledWith(expect.objectContaining({
        status: 'pending'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by userId', async () => {
      const req = {
        query: { page: '1', limit: '20', userId: 'user-1' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.findAll.mockReturnValueOnce([]);
  mockCdtModel.count.mockReturnValueOnce(0);

      await getAllCDTs(req, res, next);

      expect(mockCdtModel.findAll).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1'
      }));
    });

    it('should forward errors to error handler', async () => {
      const req = {
        query: {},
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();
      const error = new Error('Database error');

  mockCdtModel.findAll.mockImplementationOnce(() => { throw error; });

      await getAllCDTs(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('approveCDT', () => {
    it('should approve pending CDT', async () => {
      const req = {
        params: { id: 'cdt-1' },
        user: { id: 'admin-1', name: 'Admin' }
      };
      const res = createRes();
      const next = jest.fn();

      const mockCdt = {
        id: 'cdt-1',
        status: 'pending',
        amount: 5000000
      };

  mockCdtModel.findById.mockReturnValueOnce(mockCdt);
  mockCdtModel.updateStatus.mockReturnValueOnce({ changes: 1 });
  mockCdtModel.createAuditLog.mockReturnValueOnce({});
  mockCdtModel.findById.mockReturnValueOnce({ ...mockCdt, status: 'active' });

      await approveCDT(req, res, next);

      expect(mockCdtModel.updateStatus).toHaveBeenCalledWith('cdt-1', 'active', expect.any(String));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success',
        message: 'CDT aprobado exitosamente'
      }));
    });

    it('should return 404 if CDT not found', async () => {
      const req = {
        params: { id: 'missing-id' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.findById.mockReturnValueOnce(null);

      await approveCDT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'fail',
        message: 'CDT no encontrado'
      }));
    });

    it('should reject if CDT is not pending', async () => {
      const req = {
        params: { id: 'cdt-1' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.findById.mockReturnValueOnce({
        id: 'cdt-1',
        status: 'active'
      });

      await approveCDT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'fail',
        message: expect.stringContaining('Solo se pueden aprobar CDTs en estado pending')
      }));
    });

    it('should forward errors to error handler', async () => {
      const req = {
        params: { id: 'cdt-1' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();
      const error = new Error('Database error');

  mockCdtModel.findById.mockImplementationOnce(() => { throw error; });

      await approveCDT(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('rejectCDT', () => {
    it('should reject pending CDT with reason', async () => {
      const req = {
        params: { id: 'cdt-1' },
        body: { reason: 'Documentación incompleta' },
        user: { id: 'admin-1', name: 'Admin' }
      };
      const res = createRes();
      const next = jest.fn();

      const mockCdt = {
        id: 'cdt-1',
        status: 'pending'
      };

  mockCdtModel.findById.mockReturnValueOnce(mockCdt);
  mockCdtModel.updateStatus.mockReturnValueOnce({ changes: 1 });
  mockCdtModel.createAuditLog.mockReturnValueOnce({});
  mockCdtModel.findById.mockReturnValueOnce({ ...mockCdt, status: 'cancelled' });

      await rejectCDT(req, res, next);

      expect(mockCdtModel.updateStatus).toHaveBeenCalledWith('cdt-1', 'cancelled', expect.any(String));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if reason is missing', async () => {
      const req = {
        params: { id: 'cdt-1' },
        body: {},
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

      await rejectCDT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'La razón de rechazo es requerida'
      }));
    });

    it('should return 404 if CDT not found', async () => {
      const req = {
        params: { id: 'missing-id' },
        body: { reason: 'Test' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.findById.mockReturnValueOnce(null);

      await rejectCDT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject if CDT is not pending', async () => {
      const req = {
        params: { id: 'cdt-1' },
        body: { reason: 'Test' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.findById.mockReturnValueOnce({
        id: 'cdt-1',
        status: 'completed'
      });

      await rejectCDT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should forward errors to error handler', async () => {
      const req = {
        params: { id: 'cdt-1' },
        body: { reason: 'Test' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();
      const error = new Error('Database error');

  mockCdtModel.findById.mockImplementationOnce(() => { throw error; });

      await rejectCDT(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('forceDeleteCDT', () => {
    it('should force delete CDT', async () => {
      const req = {
        params: { id: 'cdt-1' },
        user: { id: 'admin-1', name: 'Admin' },
        ip: '127.0.0.1'
      };
      const res = createRes();
      res.send = jest.fn().mockReturnValue(res);
      const next = jest.fn();

  mockCdtModel.findById.mockReturnValueOnce({
        id: 'cdt-1',
        status: 'cancelled',
        userId: 'user-1',
        amount: 5000000
      });
  mockCdtModel.createAuditLog.mockReturnValueOnce({});
  mockCdtModel.deleteById.mockReturnValueOnce(true);

      await forceDeleteCDT(req, res, next);

      expect(mockCdtModel.deleteById).toHaveBeenCalledWith('cdt-1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if CDT not found', async () => {
      const req = {
        params: { id: 'missing-id' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.findById.mockReturnValueOnce(null);

      await forceDeleteCDT(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should forward errors to error handler', async () => {
      const req = {
        params: { id: 'cdt-1' },
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();
      const error = new Error('Database error');

  mockCdtModel.findById.mockImplementationOnce(() => { throw error; });

      await forceDeleteCDT(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCDTStats', () => {
    it('should return CDT statistics', async () => {
      const req = {
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();

  mockCdtModel.count.mockReturnValueOnce(100);
  mockCdtModel.count.mockReturnValueOnce(10);
  mockCdtModel.count.mockReturnValueOnce(80);
  mockCdtModel.count.mockReturnValueOnce(5);
  mockCdtModel.count.mockReturnValueOnce(5);

      await getCDTStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'success'
      }));
    });

    it('should forward errors to error handler', async () => {
      const req = {
        user: { id: 'admin-1' }
      };
      const res = createRes();
      const next = jest.fn();
      const error = new Error('Database error');

  mockCdtModel.count.mockImplementationOnce(() => { throw error; });

      await getCDTStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
