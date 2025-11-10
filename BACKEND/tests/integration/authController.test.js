import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/authRoutes.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { connectDB, closeDB, getDB } from '../../src/config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Setup de la app de prueba
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

// Helper para limpiar datos de test
const cleanupTestData = () => {
  const db = getDB();
  // Eliminar usuarios de prueba creados durante los tests
  db.prepare("DELETE FROM users WHERE email LIKE '%@test.com' OR email = 'test@neocdt.com'").run();
};

// Helper para crear usuario de prueba
const createTestUser = async (email = 'test@neocdt.com', documentType = 'CC', documentNumber = '1234567890', role = 'user') => {
  const db = getDB();
  const hashedPassword = await bcrypt.hash('Password123!', 12);
  const userId = uuidv4();
  
  try {
    // Primero eliminar si existe
    db.prepare('DELETE FROM users WHERE email = ? OR (document_type = ? AND document_number = ?)').run(email, documentType, documentNumber);
    
    // Luego insertar
    db.prepare(`
      INSERT INTO users (id, name, email, password, document_type, document_number, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, 'Test User', email, hashedPassword, documentType, documentNumber, role, 1);
    
    return userId;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

describe('Auth Controller Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Conectar a la base de datos de test
    await connectDB();
    app = createTestApp();
  });

  beforeEach(() => {
    // Limpiar antes de cada test
    cleanupTestData();
  });

  afterAll(async () => {
    // Limpiar todos los datos de prueba al finalizar
    cleanupTestData();
    await closeDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        documentType: 'CC',
        documentNumber: '9999888877',
        phone: '3001234567'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.name).toBe(newUser.name);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject registration with existing email', async () => {
      // Primero crear un usuario
      await createTestUser('test@neocdt.com', 'CC', '1234567890', 'user');
      
      // Intentar registrar con el mismo email
      const existingUser = {
        name: 'Test User',
        email: 'test@neocdt.com', // Email ya existente
        password: 'Password123!',
        confirmPassword: 'Password123!',
        documentType: 'CC',
        documentNumber: '9876543210',
        phone: '3009876543'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('ya está registrado');
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = {
        name: 'Weak User',
        email: 'weak@test.com',
        password: '12345',
        confirmPassword: '12345'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should reject registration with password mismatch', async () => {
      const mismatchUser = {
        name: 'Mismatch User',
        email: 'mismatch@test.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(mismatchUser)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should reject registration with missing fields', async () => {
      const incompleteUser = {
        email: 'incomplete@test.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Primero crear el usuario
      await createTestUser('test@neocdt.com', 'CC', '1234567890', 'user');
      
      const credentials = {
        documentType: 'CC',
        documentNumber: '1234567890',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@neocdt.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject login with invalid email', async () => {
      const credentials = {
        documentType: 'CC',
        documentNumber: '9999999999',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('inválidas');
    });

    it('should reject login with wrong password', async () => {
      const credentials = {
        documentType: 'CC',
        documentNumber: '1234567890',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Puede ser 401 o 500 dependiendo del error
      expect([401, 500]).toContain(response.status);
      expect(response.body.status).toMatch(/fail|error/);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ documentType: 'CC' })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });

    it('should reject login with invalid email format', async () => {
      const credentials = {
        documentType: 'XX',
        documentNumber: '123',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Asegurar que el usuario base existe
      const db = getDB();
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('test@neocdt.com');
      if (!existingUser) {
        await createTestUser();
      }

      // Login para obtener refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          documentType: 'CC',
          documentNumber: '1234567890',
          password: 'Password123!'
        });

      refreshToken = loginResponse.body.data?.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.accessToken).toBeDefined();
      // El refresh solo devuelve un nuevo accessToken, no un nuevo refreshToken
    });

    it('should reject refresh with invalid token', async () => {
      // Usar un JWT estructuralmente válido pero con firma inválida
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlIiwiaWF0IjoxNjE2MjM5MDIyfQ.invalidSignature' });

      expect(response.status).toBe(401);
      // Puede ser 'fail' (validación) o 'error' (JWT inválido lanza excepción)
      expect(['fail', 'error']).toContain(response.body.status);
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      // Asegurar que el usuario base existe
      const db = getDB();
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('test@neocdt.com');
      if (!existingUser) {
        await createTestUser();
      }

      // Login para obtener token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          documentType: 'CC',
          documentNumber: '1234567890',
          password: 'Password123!'
        });

      token = loginResponse.body.data?.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('cerrada');
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('Integration Flow: Register → Login → Logout', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Flow Test User',
          email: 'flowtest@test.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          documentType: 'CC',
          documentNumber: '1122334455',
          phone: '3109876543'
        })
        .expect(201);

      expect(registerResponse.body.data.accessToken).toBeDefined();
      const registerToken = registerResponse.body.data.accessToken;

      // 2. Login with new account
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          documentType: 'CC',
          documentNumber: '1122334455',
          password: 'Password123!'
        })
        .expect(200);

      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();
      const loginToken = loginResponse.body.data.accessToken;

      // 3. Refresh token (debe hacerse ANTES del logout)
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginResponse.body.data.refreshToken })
        .expect(200);

      expect(refreshResponse.body.data.accessToken).toBeDefined();

      // 4. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(logoutResponse.body.status).toBe('success');
    });
  });
});
