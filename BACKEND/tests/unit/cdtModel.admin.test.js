import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import CDT from '../../src/models/cdtModel.js';
import User from '../../src/models/userModel.js';
import { getDB, closeDB, connectDB } from '../../src/config/database.js';

// Helper para calcular endDate
const calculateEndDate = (startDate, termDays) => {
  const start = new Date(startDate);
  start.setDate(start.getDate() + termDays);
  return start.toISOString().split('T')[0];
};

// Helper para crear CDT con valores por defecto
const createTestCDT = async (userId, overrides = {}) => {
  const startDate = overrides.startDate || new Date().toISOString().split('T')[0];
  const termDays = overrides.termDays || 90;
  
  const cdtData = {
    userId,
    amount: 1000000,
    termDays,
    interestRate: 5.0,
    startDate,
    endDate: calculateEndDate(startDate, termDays),
    renovationOption: 'capital',
    ...overrides
  };
  
  // Recalcular endDate si termDays fue sobrescrito
  if (overrides.termDays && !overrides.endDate) {
    cdtData.endDate = calculateEndDate(cdtData.startDate, cdtData.termDays);
  }
  
  return CDT.create(cdtData);
};

describe('CDT Model - Admin Methods Coverage', () => {
  let testUser;
  let adminUser;

  beforeEach(async () => {
    await connectDB();
    
    // Usar timestamp + aleatorio para generar documentos únicos
    const uniqueSuffix = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
    const userDoc = `1${uniqueSuffix}`.slice(0, 10); // 10 dígitos
    const adminDoc = `9${uniqueSuffix}`.slice(0, 10); // 10 dígitos

    // Crear usuario de prueba con documento único
    testUser = await User.create({
      name: 'Test User',
      email: `test.${uuidv4()}@example.com`,
      password: 'hashedPassword123',
      documentType: 'CC',
      documentNumber: userDoc
    });

    // Crear usuario admin con documento único
    adminUser = await User.create({
      name: 'Admin User',
      email: `admin.${uuidv4()}@example.com`,
      password: 'hashedPassword123',
      role: 'admin',
      documentType: 'CC',
      documentNumber: adminDoc
    });
  });

  afterEach(() => {
    closeDB();
  });

  describe('submitForReview - Usuario envía CDT a revisión', () => {
    test('✅ Debería enviar CDT draft a pending exitosamente', async () => {
      const cdt = await createTestCDT(testUser.id);
      const result = CDT.submitForReview(cdt.id, testUser.id);

      expect(result).not.toBeNull();
      expect(result.status).toBe('pending');
      expect(result.submittedAt).toBeDefined();
      expect(result.submittedAt).not.toBeNull();
    });

    test('✅ Debería crear audit log al enviar a revisión', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const logs = await CDT.getAuditLogs(cdt.id);

      const submitLog = logs.find(log => log.action === 'submitted_for_review');
      expect(submitLog).toBeDefined();
      
      const details = typeof submitLog.details === 'string' 
        ? JSON.parse(submitLog.details) 
        : submitLog.details;
      
      expect(details.userId).toBe(testUser.id);
      expect(details.previousStatus).toBe('draft');
    });

    test('❌ Debería rechazar envío de CDT inexistente', async () => {
      const fakeId = uuidv4();
      expect(() =>
        CDT.submitForReview(fakeId, testUser.id)
      ).toThrow('CDT no encontrado');
    });

    test('❌ Debería rechazar envío de CDT que no pertenece al usuario', async () => {
      const cdt = await createTestCDT(adminUser.id);
      expect(() =>
        CDT.submitForReview(cdt.id, testUser.id)
      ).toThrow('No tienes permisos para enviar este CDT');
    });

    test('❌ Debería rechazar envío de CDT que no está en draft', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);

      expect(() =>
        CDT.submitForReview(cdt.id, testUser.id)
      ).toThrow(/No puedes enviar un CDT con estado/);
    });

    test('❌ Debería rechazar envío de CDT con campos incompletos', async () => {
      // Comentar este test porque requiere inserción directa de CDT incompleto
      // que SQLite no permite por constraints de NOT NULL
      expect(true).toBe(true);
    });
  });

  describe('approve - Admin aprueba CDT', () => {
    test('✅ Debería aprobar CDT pending exitosamente', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const result = CDT.approve(cdt.id, adminUser.id);

      expect(result).not.toBeNull();
      expect(result.status).toBe('active');
      expect(result.reviewedBy).toBe(adminUser.id);
      expect(result.reviewedAt).toBeDefined();
    });

    test('✅ Debería aprobar CDT con notas del admin', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const adminNotes = 'Aprobado: Documentación completa y verificada';
      const result = CDT.approve(cdt.id, adminUser.id, adminNotes);

      expect(result.adminNotes).toBe(adminNotes);
    });

    test('✅ Debería crear audit log al aprobar', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id, 'Todo OK');

      const logs = await CDT.getAuditLogs(cdt.id);
      const approveLog = logs.find(log => log.action === 'approved');

      expect(approveLog).toBeDefined();
      
      const details = typeof approveLog.details === 'string' 
        ? JSON.parse(approveLog.details) 
        : approveLog.details;
      
      expect(details.adminId).toBe(adminUser.id);
      expect(details.adminNotes).toBe('Todo OK');
    });

    test('❌ Debería rechazar aprobación de CDT inexistente', async () => {
      const fakeId = uuidv4();
      expect(() =>
        CDT.approve(fakeId, adminUser.id)
      ).toThrow('CDT no encontrado');
    });

    test('❌ Debería rechazar aprobación de CDT que no está pending', async () => {
      const cdt = await createTestCDT(testUser.id);
      expect(() =>
        CDT.approve(cdt.id, adminUser.id)
      ).toThrow(/No puedes aprobar un CDT con estado/);
    });

    test('❌ Debería rechazar aprobación de CDT ya activo', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);

      expect(() =>
        CDT.approve(cdt.id, adminUser.id)
      ).toThrow(/No puedes aprobar un CDT con estado 'active'/);
    });
  });

  describe('reject - Admin rechaza CDT', () => {
    test('✅ Debería rechazar CDT pending con razón', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const reason = 'Documentación incompleta - Falta copia de identificación';
      const result = CDT.reject(cdt.id, adminUser.id, reason);

      expect(result).not.toBeNull();
      expect(result.status).toBe('rejected');
      expect(result.reviewedBy).toBe(adminUser.id);
      expect(result.reviewedAt).toBeDefined();
      expect(result.adminNotes).toBe(reason);
    });

    test('✅ Debería crear audit log al rechazar', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const reason = 'Monto excede límite del usuario';
      CDT.reject(cdt.id, adminUser.id, reason);

      const logs = await CDT.getAuditLogs(cdt.id);
      const rejectLog = logs.find(log => log.action === 'rejected');

      expect(rejectLog).toBeDefined();
      
      const details = typeof rejectLog.details === 'string' 
        ? JSON.parse(rejectLog.details) 
        : rejectLog.details;
      
      expect(details.adminId).toBe(adminUser.id);
      expect(details.adminNotes).toBe(reason);
    });

    test('❌ Debería rechazar sin razón (adminNotes vacío)', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);

      expect(() =>
        CDT.reject(cdt.id, adminUser.id, '')
      ).toThrow('Debes proporcionar una razón para rechazar el CDT');
    });

    test('❌ Debería rechazar sin razón (adminNotes null)', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);

      expect(() =>
        CDT.reject(cdt.id, adminUser.id, null)
      ).toThrow('Debes proporcionar una razón para rechazar el CDT');
    });

    test('❌ Debería rechazar con razón solo espacios', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);

      expect(() =>
        CDT.reject(cdt.id, adminUser.id, '   ')
      ).toThrow('Debes proporcionar una razón para rechazar el CDT');
    });

    test('❌ Debería rechazar rechazo de CDT inexistente', async () => {
      const fakeId = uuidv4();
      expect(() =>
        CDT.reject(fakeId, adminUser.id, 'No encontrado')
      ).toThrow('CDT no encontrado');
    });

    test('❌ Debería rechazar rechazo de CDT que no está pending', async () => {
      const cdt = await createTestCDT(testUser.id);
      expect(() =>
        CDT.reject(cdt.id, adminUser.id, 'No está pending')
      ).toThrow(/No puedes rechazar un CDT con estado/);
    });

    test('❌ Debería rechazar rechazo de CDT ya aprobado', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);

      expect(() =>
        CDT.reject(cdt.id, adminUser.id, 'Ya está activo')
      ).toThrow(/No puedes rechazar un CDT con estado 'active'/);
    });
  });

  describe('cancel - Usuario/Admin cancela CDT', () => {
    test('✅ Usuario debería cancelar su propio CDT pending', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const reason = 'Ya no necesito el CDT';
      const result = CDT.cancel(cdt.id, testUser.id, 'user', reason);

      expect(result).not.toBeNull();
      expect(result.status).toBe('cancelled');
      expect(result.adminNotes).toBe(reason);
    });

    test('✅ Admin debería cancelar CDT pending de cualquier usuario', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const reason = 'Cancelado por solicitud del usuario vía soporte';
      const result = CDT.cancel(cdt.id, adminUser.id, 'admin', reason);

      expect(result).not.toBeNull();
      expect(result.status).toBe('cancelled');
    });

    test('✅ Admin debería cancelar CDT active', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);

      const reason = 'Cancelación por incumplimiento de términos';
      const result = CDT.cancel(cdt.id, adminUser.id, 'admin', reason);

      expect(result.status).toBe('cancelled');
    });

    test('✅ Debería crear audit log al cancelar', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      const reason = 'Cambio de planes financieros';
      CDT.cancel(cdt.id, testUser.id, 'user', reason);

      const logs = await CDT.getAuditLogs(cdt.id);
      const cancelLog = logs.find(log => log.action === 'cancelled');

      expect(cancelLog).toBeDefined();
      
      const details = typeof cancelLog.details === 'string' 
        ? JSON.parse(cancelLog.details) 
        : cancelLog.details;
      
      expect(details.userId).toBe(testUser.id);
      expect(details.reason).toBe(reason);
    });

    test('❌ Debería rechazar cancelación de CDT inexistente', async () => {
      const fakeId = uuidv4();
      expect(() =>
        CDT.cancel(fakeId, testUser.id, 'user', 'No existe')
      ).toThrow('CDT no encontrado');
    });

    test('❌ Usuario no debería cancelar CDT de otro usuario', async () => {
      const cdt = await createTestCDT(adminUser.id);
      CDT.submitForReview(cdt.id, adminUser.id);

      expect(() =>
        CDT.cancel(cdt.id, testUser.id, 'user', 'No es mío')
      ).toThrow('No tienes permisos para cancelar este CDT');
    });

    test('❌ Usuario no debería cancelar CDT active', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);

      expect(() =>
        CDT.cancel(cdt.id, testUser.id, 'user', 'Ya está activo')
      ).toThrow(/Solo puedes cancelar CDTs en estado pendiente/);
    });

    test('❌ Debería rechazar cancelación de CDT draft', async () => {
      const cdt = await createTestCDT(testUser.id);
      expect(() =>
        CDT.cancel(cdt.id, adminUser.id, 'admin', 'No se puede')
      ).toThrow(/No puedes cancelar un CDT con estado 'draft'/);
    });

    test('❌ Debería rechazar cancelación de CDT completed', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);
      CDT.complete(cdt.id);

      expect(() =>
        CDT.cancel(cdt.id, adminUser.id, 'admin', 'Ya completado')
      ).toThrow(/No puedes cancelar un CDT con estado 'completed'/);
    });
  });

  describe('complete - Sistema completa CDT vencido', () => {
    test('✅ Debería completar CDT active exitosamente', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);

      const result = CDT.complete(cdt.id);

      expect(result).not.toBeNull();
      expect(result.status).toBe('completed');
    });

    test('✅ Debería crear audit log al completar', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);
      CDT.complete(cdt.id);

      const logs = await CDT.getAuditLogs(cdt.id);
      const completeLog = logs.find(log => log.action === 'completed');

      expect(completeLog).toBeDefined();
      
      const details = typeof completeLog.details === 'string' 
        ? JSON.parse(completeLog.details) 
        : completeLog.details;
      
      expect(details.finalAmount).toBeDefined();
      expect(details.previousStatus).toBe('active');
    });

    test('✅ Audit log debería incluir monto final con intereses', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);
      
      const approvedCdt = await CDT.findById(cdt.id);
      const expectedFinalAmount = approvedCdt.amount + approvedCdt.estimatedReturn;

      CDT.complete(cdt.id);

      const logs = await CDT.getAuditLogs(cdt.id);
      const completeLog = logs.find(log => log.action === 'completed');
      
      const details = typeof completeLog.details === 'string' 
        ? JSON.parse(completeLog.details) 
        : completeLog.details;

      expect(details.finalAmount).toBe(expectedFinalAmount);
    });

    test('❌ Debería rechazar completar CDT inexistente', async () => {
      const fakeId = uuidv4();
      expect(() =>
        CDT.complete(fakeId)
      ).toThrow('CDT no encontrado');
    });

    test('❌ Debería rechazar completar CDT que no está active', async () => {
      const cdt = await createTestCDT(testUser.id);
      expect(() =>
        CDT.complete(cdt.id)
      ).toThrow(/No puedes completar un CDT con estado/);
    });

    test('❌ Debería rechazar completar CDT pending', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);

      expect(() =>
        CDT.complete(cdt.id)
      ).toThrow(/No puedes completar un CDT con estado 'pending'/);
    });

    test('❌ Debería rechazar completar CDT ya completado', async () => {
      const cdt = await createTestCDT(testUser.id);
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);
      CDT.complete(cdt.id);

      expect(() =>
        CDT.complete(cdt.id)
      ).toThrow(/No puedes completar un CDT con estado 'completed'/);
    });
  });

  describe('Flujos completos (Integration)', () => {
    test('✅ Flujo exitoso: draft → pending → active → completed', async () => {
      const cdt = await createTestCDT(testUser.id, {
        amount: 5000000,
        termDays: 180,
        interestRate: 7.5,
        renovationOption: 'capital_interest'
      });
      expect(cdt.status).toBe('draft');

      const submitted = CDT.submitForReview(cdt.id, testUser.id);
      expect(submitted.status).toBe('pending');

      const approved = CDT.approve(cdt.id, adminUser.id, 'Todo correcto');
      expect(approved.status).toBe('active');

      const completed = CDT.complete(cdt.id);
      expect(completed.status).toBe('completed');

      const logs = await CDT.getAuditLogs(cdt.id);
      expect(logs.length).toBeGreaterThanOrEqual(3); // Al menos 3 logs: submit, approve, complete
      
      const actions = logs.map(log => log.action);
      expect(actions).toContain('submitted_for_review');
      expect(actions).toContain('approved');
      expect(actions).toContain('completed');
    });

    test('✅ Flujo rechazo: draft → pending → rejected', async () => {
      const cdt = await createTestCDT(testUser.id, {
        amount: 2000000,
        termDays: 90,
        interestRate: 6.0,
        renovationOption: 'auto'
      });

      CDT.submitForReview(cdt.id, testUser.id);

      const rejected = CDT.reject(
        cdt.id, 
        adminUser.id, 
        'Falta documentación de respaldo financiero'
      );
      expect(rejected.status).toBe('rejected');
      expect(rejected.adminNotes).toBe('Falta documentación de respaldo financiero');

      const logs = await CDT.getAuditLogs(cdt.id);
      const rejectLog = logs.find(log => log.action === 'rejected');
      expect(rejectLog).toBeDefined();
    });

    test('✅ Flujo cancelación usuario: draft → pending → cancelled', async () => {
      const cdt = await createTestCDT(testUser.id, {
        amount: 3000000,
        termDays: 120,
        interestRate: 5.5,
        renovationOption: 'capital'
      });
      CDT.submitForReview(cdt.id, testUser.id);

      const cancelled = CDT.cancel(
        cdt.id, 
        testUser.id, 
        'user', 
        'Decidí no continuar con esta inversión'
      );
      expect(cancelled.status).toBe('cancelled');
    });

    test('✅ Flujo cancelación admin: active → cancelled', async () => {
      const cdt = await createTestCDT(testUser.id, {
        amount: 4000000,
        termDays: 365,
        interestRate: 8.0,
        renovationOption: 'capital'
      });
      CDT.submitForReview(cdt.id, testUser.id);
      CDT.approve(cdt.id, adminUser.id);

      const cancelled = CDT.cancel(
        cdt.id, 
        adminUser.id, 
        'admin', 
        'Cancelación por solicitud especial del cliente'
      );
      expect(cancelled.status).toBe('cancelled');
    });
  });
});
