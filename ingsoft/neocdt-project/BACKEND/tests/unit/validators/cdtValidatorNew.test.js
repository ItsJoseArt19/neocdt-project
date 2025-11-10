import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { 
  validateCreateCDT, 
  validateUpdateCDT,
  validateChangeStatus,
  validateCancelCDT,
  validateCDTFilters,
  handleValidationErrors 
} from '../../../src/validators/cdtValidatorNew.js';
import { CDT_RULES } from '../../../src/config/financialRules.js';

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

describe('cdtValidatorNew - validateCreateCDT', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateCreateCDT);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar un CDT válido con todos los campos', async () => {
      const validCDT = {
        amount: 1000000,
        termDays: 180,
        interestRate: 5.5,
        startDate: new Date(Date.now() + 86400000).toISOString(), // +1 día
        renovationOption: 'capital'
      };

      const response = await request(app)
        .post('/test')
        .send(validCDT);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('Debería aceptar CDT con campos opcionales omitidos', async () => {
      const minimalCDT = {
        amount: 500000,
        termDays: 30,
        interestRate: 1.0
      };

      const response = await request(app)
        .post('/test')
        .send(minimalCDT);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('Debería aceptar monto mínimo (500,000)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: CDT_RULES.amount.min,
          termDays: 90,
          interestRate: 3.5
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar monto máximo (500,000,000)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: CDT_RULES.amount.max,
          termDays: 360,
          interestRate: 7.0
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar plazo mínimo (30 días)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: CDT_RULES.term.minDays,
          interestRate: 4.0
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar plazo máximo (730 días)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 2000000,
          termDays: CDT_RULES.term.maxDays,
          interestRate: 8.0
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar tasa mínima (0.5%)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: CDT_RULES.interestRate.min
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar tasa máxima (9.5%)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 3000000,
          termDays: 180,
          interestRate: CDT_RULES.interestRate.max
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar renovationOption: capital', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1500000,
          termDays: 120,
          interestRate: 5.0,
          renovationOption: 'capital'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar renovationOption: capital_interest', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 2000000,
          termDays: 180,
          interestRate: 6.0,
          renovationOption: 'capital_interest'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar renovationOption: auto', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 2500000,
          termDays: 240,
          interestRate: 7.0,
          renovationOption: 'auto'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar fecha de inicio dentro del rango permitido (15 días)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 4.5,
          startDate: futureDate.toISOString()
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de amount', () => {
    test('Debería rechazar monto vacío', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          termDays: 90,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('monto es requerido');
    });

    test('Debería rechazar monto menor al mínimo (499,999)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 499999,
          termDays: 90,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/monto debe estar entre/i);
    });

    test('Debería rechazar monto mayor al máximo (500,000,001)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 500000001,
          termDays: 180,
          interestRate: 5.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/monto debe estar entre/i);
    });

    test('Debería rechazar monto con formato inválido (string)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 'mil pesos',
          termDays: 90,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/monto/i);
    });

    test('Debería rechazar monto negativo', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: -1000000,
          termDays: 90,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/monto/i);
    });

    test('Debería rechazar monto igual a cero', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 0,
          termDays: 90,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/monto/i);
    });
  });

  describe('❌ Validaciones de termDays', () => {
    test('Debería rechazar plazo vacío', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('plazo es requerido');
    });

    test('Debería rechazar plazo menor al mínimo (29 días)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 29,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/plazo debe estar entre/i);
    });

    test('Debería rechazar plazo mayor al máximo (731 días)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 2000000,
          termDays: 731,
          interestRate: 5.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/plazo debe estar entre/i);
    });

    test('Debería rechazar plazo con decimales', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90.5,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/plazo/i);
    });

    test('Debería rechazar plazo negativo', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: -30,
          interestRate: 4.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/plazo/i);
    });
  });

  describe('❌ Validaciones de interestRate', () => {
    test('Debería rechazar tasa vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('tasa de interés es requerida');
    });

    test('Debería rechazar tasa menor al mínimo (0.4%)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 0.4
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tasa de interés debe estar entre/i);
    });

    test('Debería rechazar tasa mayor al máximo (9.6%)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 2000000,
          termDays: 180,
          interestRate: 9.6
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tasa de interés debe estar entre/i);
    });

    test('Debería rechazar tasa negativa', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: -2.0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tasa/i);
    });

    test('Debería rechazar tasa igual a cero', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tasa/i);
    });
  });

  describe('❌ Validaciones de startDate', () => {
    test('Debería rechazar fecha en el pasado', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 4.0,
          startDate: pastDate.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('no puede ser en el pasado');
    });

    test('Debería rechazar fecha más de 30 días en el futuro', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 31);

      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 4.0,
          startDate: farFuture.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('no puede ser mayor a 30 días');
    });

    test('Debería rechazar formato de fecha inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 4.0,
          startDate: '31/12/2025'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/fecha/i);
    });
  });

  describe('❌ Validaciones de renovationOption', () => {
    test('Debería rechazar renovationOption inválida', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 4.0,
          renovationOption: 'invalid_option'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/renovación/i);
    });

    test('Debería rechazar renovationOption vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 1000000,
          termDays: 90,
          interestRate: 4.0,
          renovationOption: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/renovación/i);
    });
  });
});

describe('cdtValidatorNew - validateUpdateCDT', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateUpdateCDT);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar actualización de amount válido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ amount: 1500000 });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar actualización de termDays válido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ termDays: 180 });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar actualización de interestRate válido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ interestRate: 6.5 });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar actualización de múltiples campos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          amount: 2000000,
          termDays: 240,
          interestRate: 7.0
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar body vacío (sin campos a actualizar)', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de campos', () => {
    test('Debería rechazar amount inválido en actualización', async () => {
      const response = await request(app)
        .post('/test')
        .send({ amount: 300000 }); // Menor al mínimo

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/monto/i);
    });

    test('Debería rechazar termDays inválido en actualización', async () => {
      const response = await request(app)
        .post('/test')
        .send({ termDays: 25 }); // Menor al mínimo

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/plazo/i);
    });

    test('Debería rechazar interestRate inválido en actualización', async () => {
      const response = await request(app)
        .post('/test')
        .send({ interestRate: 20 }); // Mayor al máximo

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tasa/i);
    });
  });
});

describe('cdtValidatorNew - validateChangeStatus', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateChangeStatus);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar status: pending', async () => {
      const response = await request(app)
        .post('/test')
        .send({ status: 'pending' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar status: active', async () => {
      const response = await request(app)
        .post('/test')
        .send({ status: 'active' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar status: completed', async () => {
      const response = await request(app)
        .post('/test')
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar status: cancelled con reason', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          status: 'cancelled',
          reason: 'Usuario solicitó cancelación'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar status: rejected con reason', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          status: 'rejected',
          reason: 'Documentación incompleta'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de status', () => {
    test('Debería rechazar status vacío', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('estado es requerido');
    });

    test('Debería rechazar status inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/estado/i);
    });

    test('Debería rechazar reason muy larga (>500 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          status: 'cancelled',
          reason: 'a'.repeat(501)
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/razón.*500.*caracteres/i);
    });
  });
});

describe('cdtValidatorNew - validateCancelCDT', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateCancelCDT);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar reason válida (10-500 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          reason: 'Usuario solicitó cancelación por cambio de planes financieros'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar reason con longitud mínima (10 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          reason: '0123456789'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar reason con longitud máxima (500 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          reason: 'a'.repeat(500)
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de reason', () => {
    test('Debería rechazar reason vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('razón de cancelación es requerida');
    });

    test('Debería rechazar reason muy corta (<10 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          reason: 'corto'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/razón.*10.*caracteres/i);
    });

    test('Debería rechazar reason muy larga (>500 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ 
          reason: 'a'.repeat(501)
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/razón.*500.*caracteres/i);
    });
  });
});

describe('cdtValidatorNew - validateCDTFilters', () => {
  let app;

  beforeEach(() => {
    app = createTestAppGet(validateCDTFilters);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar parámetros válidos', async () => {
      const response = await request(app)
        .get('/test')
        .query({
          page: 1,
          limit: 10,
          status: 'active'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar sin query params (opcionales)', async () => {
      const response = await request(app).get('/test');

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

    test('Debería aceptar cada status válido', async () => {
      const statuses = ['draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'];
      
      for (const status of statuses) {
        const response = await request(app)
          .get('/test')
          .query({ status });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('❌ Validaciones de query params', () => {
    test('Debería rechazar page menor a 1', async () => {
      const response = await request(app)
        .get('/test')
        .query({ page: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/página/i);
    });

    test('Debería rechazar limit menor a 1', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/límite/i);
    });

    test('Debería rechazar limit mayor a 100', async () => {
      const response = await request(app)
        .get('/test')
        .query({ limit: 101 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/límite/i);
    });

    test('Debería rechazar status inválido', async () => {
      const response = await request(app)
        .get('/test')
        .query({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/estado/i);
    });
  });
});

describe('cdtValidatorNew - handleValidationErrors', () => {
  test('Debería manejar múltiples errores y retornar el primero', async () => {
    const app = createTestApp(validateCreateCDT);

    const response = await request(app)
      .post('/test')
      .send({}); // Sin campos requeridos

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'fail');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  test('Debería retornar estructura de error correcta', async () => {
    const app = createTestApp(validateCreateCDT);

    const response = await request(app)
      .post('/test')
      .send({ amount: 100000 }); // Monto inválido

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
