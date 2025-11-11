import request from 'supertest';
import express from 'express';
import cdtRoutes from '../../src/routes/cdtRoutes.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { connectDB, closeDB, getDB } from '../../src/config/database.js';
import { generateToken } from '../../src/utils/jwt.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Setup de la app de prueba
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/cdts', cdtRoutes);
  app.use(errorHandler);
  return app;
};

// Helper para crear usuario de prueba
const createTestUser = async (email = 'cdttest@neocdt.com', role = 'user') => {
  const db = getDB();
  const hashedPassword = await bcrypt.hash('Password123!', 12);
  const userId = uuidv4();
  
  try {
    db.prepare('DELETE FROM users WHERE email = ?').run(email);
    
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, 'CDT Test User', email, hashedPassword, role, 1);
    
    return userId;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

// Helper para crear CDT de prueba
const createTestCDT = (userId, status = 'draft') => {
  const db = getDB();
  const cdtId = uuidv4();
  const startDate = new Date();
  const termDays = 360; // 12 meses = 360 días
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + termDays);
  
  const amount = 5000000;
  const interestRate = 8.5;
  const estimatedReturn = amount * (interestRate / 100) * (termDays / 360);
  
  db.prepare(`
    INSERT INTO cdts (id, user_id, amount, term_days, interest_rate, start_date, end_date, estimated_return, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    cdtId,
    userId,
    amount,
    termDays,
    interestRate,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    estimatedReturn,
    status
  );
  
  return cdtId;
};

// Helper para limpiar datos de test
const cleanupTestData = () => {
  const db = getDB();
  db.prepare("DELETE FROM cdts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@neocdt.com' OR email LIKE '%@test.com')").run();
  db.prepare("DELETE FROM users WHERE email LIKE '%@neocdt.com' OR email LIKE '%@test.com'").run();
};

describe('CDT Controller Integration Tests', () => {
  let app;
  let userToken;
  let adminToken;
  let userId;
  let adminId;

  beforeAll(async () => {
    await connectDB();
    app = createTestApp();
    
    cleanupTestData();
    
    // Crear usuario normal y admin
    userId = await createTestUser('cdttest@neocdt.com', 'user');
    adminId = await createTestUser('admin@neocdt.com', 'admin');
    
    userToken = generateToken(userId);
    adminToken = generateToken(adminId);
  });

  afterEach(() => {
    // Limpiar solo CDTs, mantener usuarios
    const db = getDB();
    db.prepare("DELETE FROM cdts WHERE user_id IN (?, ?)").run(userId, adminId);
  });

  afterAll(async () => {
    cleanupTestData();
    await closeDB();
  });

  describe('POST /api/cdts', () => {
    it('should create a new CDT with valid data', async () => {
      const futureDate = new Date();
      // Usar 15 días para asegurarnos de no tocar el límite superior 30
      futureDate.setDate(futureDate.getDate() + 15);
      
      const cdtData = {
        amount: 5000000,
        termDays: 360,
        interestRate: 8.5,
        startDate: futureDate.toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/cdts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(cdtData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.cdt).toBeDefined();
      expect(response.body.data.cdt.amount).toBe(cdtData.amount);
      expect(response.body.data.cdt.termDays).toBe(cdtData.termDays);
      expect(response.body.data.cdt.interestRate).toBe(cdtData.interestRate);
      expect(response.body.data.cdt.status).toBe('draft');
      expect(response.body.data.cdt.userId).toBe(userId);
    });

    it('should reject CDT creation without authentication', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const cdtData = {
        amount: 5000000,
        termDays: 360,
        interestRate: 8.5,
        startDate: futureDate.toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/cdts')
        .send(cdtData)
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    it('should reject CDT with amount below minimum (500k)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      
      const cdtData = {
        amount: 499999,
        termDays: 360,
        interestRate: 8.5,
        startDate: futureDate.toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/cdts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(cdtData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      // Mensaje esperado contiene "El monto debe estar entre ..." por lo que incluimos 'monto' en el patrón
      expect(response.body.message).toMatch(/monto|entre|amount|mínimo|minim|Minimum/i);
    });

    it('should reject CDT with amount above maximum (500M)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const cdtData = {
        amount: 600000000,
        termDays: 360,
        interestRate: 8.5,
        startDate: futureDate.toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/cdts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(cdtData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toMatch(/monto|amount|máximo/i);
    });

    it('should reject CDT with invalid term months', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const cdtData = {
        amount: 5000000,
        termDays: 0,
        interestRate: 8.5,
        startDate: futureDate.toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/cdts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(cdtData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should reject CDT with missing required fields', async () => {
      const cdtData = {
        amount: 5000000
      };

      const response = await request(app)
        .post('/api/cdts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(cdtData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/cdts/my-cdts', () => {
    beforeEach(() => {
      // Crear algunos CDTs de prueba
      createTestCDT(userId, 'draft');
      createTestCDT(userId, 'pending');
      createTestCDT(userId, 'active');
    });

    it('should get all CDTs for authenticated user', async () => {
      const response = await request(app)
        .get('/api/cdts/my-cdts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdts).toBeDefined();
      expect(Array.isArray(response.body.data.cdts)).toBe(true);
      expect(response.body.data.cdts.length).toBe(3);
    });

    it('should filter CDTs by status', async () => {
      const response = await request(app)
        .get('/api/cdts/my-cdts?status=active')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdts.length).toBe(1);
      expect(response.body.data.cdts[0].status).toBe('active');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/cdts/my-cdts')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/cdts/:id', () => {
    let cdtId;

    beforeEach(() => {
      cdtId = createTestCDT(userId, 'active');
    });

    it('should get CDT by id for owner', async () => {
      const response = await request(app)
        .get(`/api/cdts/${cdtId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdt).toBeDefined();
      expect(response.body.data.cdt.id).toBe(cdtId);
      expect(response.body.data.cdt.amount).toBe(5000000);
    });

    it('should allow admin to view any CDT', async () => {
      const response = await request(app)
        .get(`/api/cdts/${cdtId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdt.id).toBe(cdtId);
    });

    it('should reject access to non-existent CDT', async () => {
      const fakeId = uuidv4();
      
      const response = await request(app)
        .get(`/api/cdts/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('no encontrado');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get(`/api/cdts/${cdtId}`)
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/cdts/:id', () => {
    let cdtId;

    beforeEach(() => {
      cdtId = createTestCDT(userId, 'draft');
    });

    it('should update CDT in draft status', async () => {
      const updateData = {
        amount: 10000000,
        termDays: 720
      };

      const response = await request(app)
        .patch(`/api/cdts/${cdtId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdt.amount).toBe(updateData.amount);
      expect(response.body.data.cdt.termDays).toBe(updateData.termDays);
    });

    it('should reject update of non-draft CDT', async () => {
      const activeCdtId = createTestCDT(userId, 'active');
      
      const updateData = {
        amount: 10000000
      };

      const response = await request(app)
        .patch(`/api/cdts/${activeCdtId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('borrador');
    });

    it('should reject update with invalid data', async () => {
      const updateData = {
        amount: 499999 // Below minimum (min = 500,000)
      };

      const response = await request(app)
        .patch(`/api/cdts/${cdtId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        amount: 10000000
      };

      const response = await request(app)
        .patch(`/api/cdts/${cdtId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/cdts/:id/status', () => {
    let cdtId;

    beforeEach(() => {
      cdtId = createTestCDT(userId, 'draft');
    });

    it('should change status from draft to pending', async () => {
      const response = await request(app)
        .patch(`/api/cdts/${cdtId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'pending' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdt.status).toBe('pending');
    });

    it('should reject invalid status transition', async () => {
      const response = await request(app)
        .patch(`/api/cdts/${cdtId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'active' })
        .expect(403); // Usuario normal no puede cambiar a 'activo', solo admin

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('administradores');
    });

    it('should reject status change without newStatus', async () => {
      const response = await request(app)
        .patch(`/api/cdts/${cdtId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('estado es requerido');
    });

    it('should reject invalid status value', async () => {
      const response = await request(app)
        .patch(`/api/cdts/${cdtId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'invalid_status' })
        .expect(400); // Validador devuelve 400 por estado inválido

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/cdts/:id/cancel', () => {
    let cdtId;

    beforeEach(() => {
      cdtId = createTestCDT(userId, 'pending');
    });

    it('should cancel CDT with valid reason', async () => {
      const response = await request(app)
        .patch(`/api/cdts/${cdtId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdt.status).toBe('cancelled');
    });

    it('should reject cancellation without reason', async () => {
      const response = await request(app)
        .patch(`/api/cdts/${cdtId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('razón');
    });

    it('should reject cancellation of completed CDT', async () => {
      const completedCdtId = createTestCDT(userId, 'completed');
      
      const response = await request(app)
        .patch(`/api/cdts/${completedCdtId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Cancel' })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/cdts/:id/audit', () => {
    let cdtId;

    beforeEach(() => {
      cdtId = createTestCDT(userId, 'draft');
      
      // Crear algunos logs de auditoría
      const db = getDB();
      db.prepare(`
        INSERT INTO cdt_audit_logs (id, cdt_id, action, details, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(uuidv4(), cdtId, 'created', JSON.stringify({ amount: 5000000 }));
    });

    it('should get audit log for CDT owner', async () => {
      const response = await request(app)
        .get(`/api/cdts/${cdtId}/audit`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.logs).toBeDefined();
      expect(Array.isArray(response.body.data.logs)).toBe(true);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
    });

    it('should allow admin to view audit log', async () => {
      const response = await request(app)
        .get(`/api/cdts/${cdtId}/audit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.logs).toBeDefined();
    });
  });

  describe('DELETE /api/cdts/:id (Admin only)', () => {
    let cdtId;

    beforeEach(() => {
      cdtId = createTestCDT(userId, 'draft');
    });

    it('should allow admin to delete CDT', async () => {
      await request(app)
        .delete(`/api/cdts/${cdtId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // 204 No Content no tiene body - response no es necesaria
    });

    it('should reject delete from non-admin user', async () => {
      // Crear un CDT propiedad de otro usuario (admin), para que el usuario no-propietario no pueda borrarlo
      const otherCdtId = createTestCDT(adminId, 'draft');

      const response = await request(app)
        .delete(`/api/cdts/${otherCdtId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('permiso');
    });

    it('should reject delete of non-existent CDT', async () => {
      const fakeId = uuidv4();
      
      const response = await request(app)
        .delete(`/api/cdts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/cdts (Admin only)', () => {
    beforeEach(() => {
      // Crear CDTs para diferentes usuarios
      createTestCDT(userId, 'active');
      createTestCDT(adminId, 'pending');
    });

    it('should allow admin to get all CDTs', async () => {
      const response = await request(app)
        .get('/api/cdts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.cdts).toBeDefined();
      expect(Array.isArray(response.body.data.cdts)).toBe(true);
      expect(response.body.data.cdts.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject access from non-admin user', async () => {
      const response = await request(app)
        .get('/api/cdts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('permiso');
    });

    it('should filter CDTs by status', async () => {
      const response = await request(app)
        .get('/api/cdts?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.cdts.forEach(cdt => {
        expect(cdt.status).toBe('active');
      });
    });
  });
});
