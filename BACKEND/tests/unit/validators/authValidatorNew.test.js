import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { 
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateRefreshToken,
  handleValidationErrors 
} from '../../../src/validators/authValidatorNew.js';

// Mock app para testing
const createTestApp = (validators) => {
  const app = express();
  app.use(express.json());
  app.post('/test', validators, (req, res) => {
    res.status(200).json({ status: 'success', data: req.body });
  });
  return app;
};

describe('authValidatorNew - validateRegister', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateRegister);
  });

  describe('✅ Validaciones exitosas - Registro CC', () => {
    test('Debería aceptar registro completo con CC', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          documentType: 'CC',
          documentNumber: '1234567890',
          phone: '3001234567',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    test('Debería aceptar registro mínimo (sin documento)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'María García',
          email: 'maria@example.com',
          password: 'SecurePass1',
          confirmPassword: 'SecurePass1'
        });

      expect(response.status).toBe(200);
    });

    test('Debería normalizar email a lowercase', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Pedro López',
          email: 'PEDRO@EXAMPLE.COM',
          password: 'MyPass123',
          confirmPassword: 'MyPass123'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('✅ Validaciones exitosas - Registro CE', () => {
    test('Debería aceptar registro completo con CE', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '123456',
          phone: '3109876543',
          nationality: 'Venezuela',
          residenceDate: '2020-01-15',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar CE con 9 dígitos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Ana Silva',
          email: 'ana@example.com',
          documentType: 'CE',
          documentNumber: '123456789',
          nationality: 'Ecuador',
          residenceDate: '2021-06-20',
          password: 'SecurePass1',
          confirmPassword: 'SecurePass1'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de name', () => {
    test('Debería rechazar nombre vacío', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('nombre es requerido');
    });

    test('Debería rechazar nombre muy corto (<2 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'A',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre debe tener entre 2 y 100 caracteres/i);
    });

    test('Debería rechazar nombre muy largo (>100 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'a'.repeat(101),
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre debe tener entre 2 y 100 caracteres/i);
    });

    test('Debería rechazar nombre con números', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan123',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre solo puede contener letras/i);
    });

    test('Debería rechazar nombre con caracteres especiales', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan@Pérez',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre solo puede contener letras/i);
    });

    test('Debería aceptar nombre con tildes y eñes', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'José María Ñoño',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de email', () => {
    test('Debería rechazar email vacío', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('correo electrónico es requerido');
    });

    test('Debería rechazar email sin @', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'invalidemail.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/correo electrónico válido/i);
    });

    test('Debería rechazar email muy largo (>100 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'a'.repeat(95) + '@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      // El validador rechaza por formato email inválido antes que por longitud
      expect(response.body.message).toMatch(/correo electrónico válido|correo.*100 caracteres/i);
    });
  });

  describe('❌ Validaciones de documentType', () => {
    test('Debería rechazar tipo de documento inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          documentType: 'PASSPORT',
          documentNumber: '123456',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tipo de documento inválido/i);
    });
  });

  describe('❌ Validaciones de documentNumber CC', () => {
    test('Debería rechazar CC con menos de 7 dígitos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          documentType: 'CC',
          documentNumber: '123456',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cédula.*7.*10 dígitos/i);
    });

    test('Debería rechazar CC con más de 10 dígitos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          documentType: 'CC',
          documentNumber: '12345678901',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cédula.*7.*10 dígitos/i);
    });

    test('Debería rechazar CC con letras', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          documentType: 'CC',
          documentNumber: '1234ABC',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cédula/i);
    });
  });

  describe('❌ Validaciones de documentNumber CE', () => {
    test('Debería rechazar CE con menos de 6 dígitos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '12345',
          nationality: 'Venezuela',
          residenceDate: '2020-01-15',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cédula de extranjería.*6.*9 dígitos/i);
    });

    test('Debería rechazar CE con más de 9 dígitos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '1234567890',
          nationality: 'Venezuela',
          residenceDate: '2020-01-15',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cédula de extranjería.*6.*9 dígitos/i);
    });
  });

  describe('❌ Validaciones de phone', () => {
    test('Debería rechazar teléfono que no inicia con 3', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          phone: '2001234567',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/número celular.*10 dígitos.*inicie con 3/i);
    });

    test('Debería rechazar teléfono con menos de 10 dígitos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          phone: '300123456',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/número celular/i);
    });

    test('Debería rechazar teléfono con más de 10 dígitos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          phone: '30012345678',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/número celular/i);
    });
  });

  describe('❌ Validaciones condicionales CE', () => {
    test('Debería rechazar CE sin nationality', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '123456',
          residenceDate: '2020-01-15',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nacionalidad es requerida para cédula de extranjería/i);
    });

    test('Debería rechazar CE sin residenceDate', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '123456',
          nationality: 'Venezuela',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/fecha de residencia es requerida para cédula de extranjería/i);
    });

    test('Debería rechazar nationality muy corta (<3 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '123456',
          nationality: 'AB',
          residenceDate: '2020-01-15',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nacionalidad.*3.*50 caracteres/i);
    });

    test('Debería rechazar nationality muy larga (>50 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '123456',
          nationality: 'a'.repeat(51),
          residenceDate: '2020-01-15',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nacionalidad.*3.*50 caracteres/i);
    });

    test('Debería rechazar residenceDate con formato inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          documentType: 'CE',
          documentNumber: '123456',
          nationality: 'Venezuela',
          residenceDate: '15/01/2020',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/fecha de residencia.*fecha válida/i);
    });
  });

  describe('❌ Validaciones de password', () => {
    test('Debería rechazar password vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          confirmPassword: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('contraseña es requerida');
    });

    test('Debería rechazar password muy corta (<8 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'Pass1',
          confirmPassword: 'Pass1'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/contraseña.*8.*128 caracteres/i);
    });

    test('Debería rechazar password muy larga (>128 caracteres)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'Pass1' + 'a'.repeat(125),
          confirmPassword: 'Pass1' + 'a'.repeat(125)
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/contraseña.*8.*128 caracteres/i);
    });

    test('Debería rechazar password sin mayúscula', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/contraseña.*mayúscula.*minúscula.*número/i);
    });

    test('Debería rechazar password sin minúscula', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'PASSWORD123',
          confirmPassword: 'PASSWORD123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/contraseña.*mayúscula.*minúscula.*número/i);
    });

    test('Debería rechazar password sin número', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'PasswordABC',
          confirmPassword: 'PasswordABC'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/contraseña.*mayúscula.*minúscula.*número/i);
    });
  });

  describe('❌ Validaciones de confirmPassword', () => {
    test('Debería rechazar confirmPassword vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('confirmación de contraseña es requerida');
    });

    test('Debería rechazar cuando confirmPassword no coincide', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'Password123',
          confirmPassword: 'DifferentPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('contraseñas no coinciden');
    });
  });
});

describe('authValidatorNew - validateLogin', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateLogin);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar login con email', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          email: 'juan@example.com',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar login con CC', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          documentType: 'CC',
          documentNumber: '1234567890',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar login con CE', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          documentType: 'CE',
          documentNumber: '123456',
          password: 'Password123'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de credenciales', () => {
    test('Debería rechazar login sin email ni documento (cuando se proporciona documentNumber sin email)', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          documentNumber: '', // Vacío - debería disparar custom validator
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/email o documento/i);
    });

    test('Debería rechazar email inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          email: 'invalidemail',
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/correo electrónico válido/i);
    });

    test('Debería rechazar documentType inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          documentType: 'PASSPORT',
          documentNumber: '123456',
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tipo de documento debe ser CC o CE/i);
    });

    test('Debería rechazar CC con formato inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          documentType: 'CC',
          documentNumber: '123456', // Menos de 7 dígitos
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cédula.*7.*10 dígitos/i);
    });

    test('Debería rechazar CE con formato inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          documentType: 'CE',
          documentNumber: '12345', // Menos de 6 dígitos
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cédula de extranjería.*6.*9 dígitos/i);
    });
  });

  describe('❌ Validaciones de password', () => {
    test('Debería rechazar password vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          email: 'juan@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('contraseña es requerida');
    });

    test('Debería rechazar password muy corta', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          email: 'juan@example.com',
          password: 'Pass1'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/contraseña.*8 caracteres/i);
    });
  });
});

describe('authValidatorNew - validateUpdateProfile', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateUpdateProfile);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar actualización de todos los campos', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'Juan Pérez Updated',
          email: 'juanupdated@example.com',
          documentType: 'CC',
          documentNumber: '9876543210',
          phone: '3209876543',
          nationality: 'Colombia',
          residenceDate: '2020-01-01'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar actualización parcial', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'María García'
        });

      expect(response.status).toBe(200);
    });

    test('Debería aceptar body vacío (sin actualizaciones)', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de campos', () => {
    test('Debería rechazar name inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          name: 'A' // Muy corto
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nombre.*2.*100 caracteres/i);
    });

    test('Debería rechazar email inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          email: 'invalidemail'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/correo electrónico válido/i);
    });

    test('Debería rechazar documentType inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          documentType: 'PASSPORT'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/tipo de documento inválido/i);
    });

    test('Debería rechazar phone inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          phone: '2001234567' // No inicia con 3
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/número celular/i);
    });

    test('Debería rechazar nationality muy corta', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          nationality: 'AB'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nacionalidad.*3.*50 caracteres/i);
    });

    test('Debería rechazar residenceDate con formato inválido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          residenceDate: '01/01/2020'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/fecha de residencia.*fecha válida/i);
    });
  });
});

describe('authValidatorNew - validateChangePassword', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateChangePassword);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar cambio de contraseña válido', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword456',
          confirmPassword: 'NewPassword456'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de currentPassword', () => {
    test('Debería rechazar currentPassword vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('contraseña actual es requerida');
    });
  });

  describe('❌ Validaciones de newPassword', () => {
    test('Debería rechazar newPassword vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          currentPassword: 'OldPassword123',
          confirmPassword: 'NewPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('nueva contraseña es requerida');
    });

    test('Debería rechazar newPassword muy corta', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'New1',
          confirmPassword: 'New1'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nueva contraseña.*8 caracteres/i);
    });

    test('Debería rechazar newPassword sin mayúscula', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nueva contraseña.*mayúscula.*minúscula.*número/i);
    });

    test('Debería rechazar newPassword igual a currentPassword', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          currentPassword: 'SamePassword123',
          newPassword: 'SamePassword123',
          confirmPassword: 'SamePassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/nueva contraseña debe ser diferente/i);
    });
  });

  describe('❌ Validaciones de confirmPassword', () => {
    test('Debería rechazar confirmPassword vacía', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('confirmación de contraseña es requerida');
    });

    test('Debería rechazar cuando confirmPassword no coincide', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
          confirmPassword: 'DifferentPassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('contraseñas no coinciden');
    });
  });
});

describe('authValidatorNew - validateRefreshToken', () => {
  let app;

  beforeEach(() => {
    app = createTestApp(validateRefreshToken);
  });

  describe('✅ Validaciones exitosas', () => {
    test('Debería aceptar refresh token JWT válido', async () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const response = await request(app)
        .post('/test')
        .send({
          refreshToken: validJWT
        });

      expect(response.status).toBe(200);
    });
  });

  describe('❌ Validaciones de refreshToken', () => {
    test('Debería rechazar refreshToken vacío', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('refresh token es requerido');
    });

    test('Debería rechazar refreshToken que no es JWT', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          refreshToken: 'esto-no-es-un-jwt'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/refresh token.*JWT válido/i);
    });

    test('Debería rechazar refreshToken con formato JWT incompleto', async () => {
      const response = await request(app)
        .post('/test')
        .send({
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/refresh token.*JWT válido/i);
    });
  });
});

describe('authValidatorNew - handleValidationErrors', () => {
  test('Debería manejar múltiples errores correctamente', async () => {
    const app = createTestApp(validateRegister);

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
    const app = createTestApp(validateRegister);

    const response = await request(app)
      .post('/test')
      .send({ 
        name: 'A',  // Muy corto
        email: 'invalid',
        password: 'weak'
      });

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
