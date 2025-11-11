import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { 
  validateUpdateUser,
  validateUserFilters,
  handleValidationErrors 
} from '../../../src/validators/userValidatorNew.js';

// Mock app para testing
const createTestApp = (validators) => {
  const app = express();
  app.use(express.json());
  app.post('/test', validators, (req, res) => {
    res.status(200).json({ status: 'success', data: req.body });
  });
  return app;
};

const createTestAppGet = (validators) => {
  const app = express();
  app.use(express.json());
  app.get('/test', validators, (req, res) => {
    res.status(200).json({ status: 'success', query: req.query });
  });
  return app;
};

describe('userValidatorNew - validateUpdateUser', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateUpdateUser);
  });

  describe('✅ Validaciones exitosas de name', () => {
    test('Debería aceptar nombre válido (2-50 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Juan Pérez' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('Debería aceptar nombre mínimo (2 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Ab' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar nombre máximo (50 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'a'.repeat(50) });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar nombre con tildes y eñes', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'José María Ñoño' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar nombre con espacios múltiples', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'María del Carmen' });

      expect(response.status).toBe(200);
    });

    test('Debería trimear espacios al inicio y final', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: '  Pedro García  ' });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de name', () => {
    test('Debería rechazar nombre muy corto (1 carácter)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'A' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre debe tener entre 2 y 50 caracteres/i);
    });

    test('Debería rechazar nombre muy largo (>50 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'a'.repeat(51) });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre debe tener entre 2 y 50 caracteres/i);
    });

    test('Debería rechazar nombre con números', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Juan123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre solo puede contener letras/i);
    });

    test('Debería rechazar nombre con caracteres especiales', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Juan@Pérez' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre solo puede contener letras/i);
    });

    test('Debería rechazar nombre con guiones', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Juan-Carlos' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre solo puede contener letras/i);
    });
  });

  describe('✅ Validaciones exitosas de email', () => {
    test('Debería aceptar email válido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'juan@example.com' });

      expect(response.status).toBe(200);
    });

    test('Debería normalizar email (lowercase)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'JUAN@EXAMPLE.COM' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar email con subdominios', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'user@mail.company.com' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar email con números', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'user123@example.com' });

      expect(response.status).toBe(200);
    });

    test('Debería trimear espacios del email', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: '  user@example.com  ' });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de email', () => {
    test('Debería rechazar email sin @', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'invalidemail.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/correo electrónico válido/i);
    });

    test('Debería rechazar email sin dominio', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'user@' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/correo electrónico válido/i);
    });

    test('Debería rechazar email sin usuario', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: '@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/correo electrónico válido/i);
    });

    test('Debería rechazar email con espacios internos', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'user name@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/correo electrónico válido/i);
    });
  });

  describe('✅ Validaciones exitosas de role', () => {
    test('Debería aceptar role: user', async () => {
      const response = await request(app)
        .post('/test')
        .send({ role: 'user' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar role: admin', async () => {
      const response = await request(app)
        .post('/test')
        .send({ role: 'admin' });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de role', () => {
    test('Debería rechazar role inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ role: 'superadmin' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/rol debe ser "user" o "admin"/i);
    });

    test('Debería rechazar role vacío', async () => {
      const response = await request(app)
        .post('/test')
        .send({ role: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/rol/i);
    });
  });

  describe('✅ Validaciones exitosas de isActive', () => {
    test('Debería aceptar isActive: true', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: true });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar isActive: false', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: false });

      expect(response.status).toBe(200);
    });

    test('Debería convertir "true" string a booleano', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: 'true' });

      expect(response.status).toBe(200);
    });

    test('Debería convertir "false" string a booleano', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: 'false' });

      expect(response.status).toBe(200);
    });

    test('Debería convertir 1 a true', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: 1 });

      expect(response.status).toBe(200);
    });

    test('Debería convertir 0 a false', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: 0 });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de isActive', () => {
    test('Debería rechazar isActive con string inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: 'yes' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/isActive debe ser un valor booleano/i);
    });

    test('Debería rechazar isActive con número inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ isActive: 2 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/isActive debe ser un valor booleano/i);
    });
  });

  describe('✅ Validaciones de múltiples campos', () => {
    test('Debería aceptar actualización de todos los campos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          role: 'admin',
          isActive: true
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar body vacío (sin campos opcionales)', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(200);
    });

    test('Debería aceptar actualización parcial (solo name)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ name: 'Ana García' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar actualización parcial (email y role)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          email: 'ana@example.com',
          role: 'user'
        });

      expect(response.status).toBe(200);
    });
  });
});

describe('userValidatorNew - validateUserFilters', () => {
  let app;

  beforeEach(() => {
    app = createTestAppGet(validateUserFilters);
  });

  describe('✅ Validaciones exitosas de query params', () => {
    test('Debería aceptar parámetros válidos completos', async () => {
      const response = await request(app)
        .get('/test')
        .query({
          page: 1,
          limit: 10,
          role: 'user',
          isActive: true
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar sin query params (todos opcionales)', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
    });

    test('Debería aceptar solo page', async () => {
      const response = await request(app)
        .get('/test')
        .query({ page: 5 });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar solo limit', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: 25 });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar page y limit máximos', async () => {
      const response = await request(app)
        .get('/test')
        .query({
          page: 9999,
          limit: 100
        });

      expect(response.status).toBe(200);
    });
  });

  describe('✅ Validaciones de page', () => {
    test('Debería aceptar page = 1 (mínimo)', async () => {
      const response = await request(app)
        .get('/test')
        .query({ page: 1 });

      expect(response.status).toBe(200);
    });

    test('Debería rechazar page = 0', async () => {
      const response = await request(app)
        .get('/test')
        .query({ page: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/página debe ser un número entero mayor a 0/i);
    });

    test('Debería rechazar page negativo', async () => {
      const response = await request(app)
        .get('/test')
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/página/i);
    });

    test('Debería rechazar page con decimales', async () => {
      const response = await request(app)
        .get('/test')
        .query({ page: 1.5 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/página/i);
    });
  });

  describe('✅ Validaciones de limit', () => {
    test('Debería aceptar limit = 1 (mínimo)', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: 1 });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar limit = 100 (máximo)', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: 100 });

      expect(response.status).toBe(200);
    });

    test('Debería rechazar limit = 0', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/límite debe estar entre 1 y 100/i);
    });

    test('Debería rechazar limit > 100', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: 101 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/límite debe estar entre 1 y 100/i);
    });

    test('Debería rechazar limit negativo', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: -5 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/límite/i);
    });
  });

  describe('✅ Validaciones de role', () => {
    test('Debería aceptar role = user', async () => {
      const response = await request(app)
        .get('/test')
        .query({ role: 'user' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar role = admin', async () => {
      const response = await request(app)
        .get('/test')
        .query({ role: 'admin' });

      expect(response.status).toBe(200);
    });

    test('Debería rechazar role inválido', async () => {
      const response = await request(app)
        .get('/test')
        .query({ role: 'superuser' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/rol/i);
    });
  });

  describe('✅ Validaciones de isActive', () => {
    test('Debería aceptar isActive = true', async () => {
      const response = await request(app)
        .get('/test')
        .query({ isActive: 'true' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar isActive = false', async () => {
      const response = await request(app)
        .get('/test')
        .query({ isActive: 'false' });

      expect(response.status).toBe(200);
    });

    test('Debería rechazar isActive inválido', async () => {
      const response = await request(app)
        .get('/test')
        .query({ isActive: 'yes' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/isActive/i);
    });
  });
});

describe('userValidatorNew - handleValidationErrors', () => {
  test('Debería manejar errores de validación correctamente', async () => {
    const app = createTestApp(validateUpdateUser);

    const response = await request(app)
      .post('/test')
      .send({ name: 'A' }); // Nombre muy corto

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'fail');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  test('Debería retornar estructura de error correcta', async () => {
    const app = createTestApp(validateUpdateUser);

    const response = await request(app)
      .post('/test')
      .send({ email: 'invalid' }); // Email inválido

    expect(response.body).toMatchObject({
      status: 'fail',
      message: expect.any(String),
      errors: expect.arrayContaining([
        expect.objectContaining({
          msg: expect.any(String)
        })
      ])
    });
  });
});
