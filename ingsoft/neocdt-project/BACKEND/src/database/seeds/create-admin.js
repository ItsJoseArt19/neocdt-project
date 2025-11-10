/**
 * Script para crear un usuario administrador
 * Ejecutar: node src/database/seeds/create-admin.js
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env.js';
import { cliLogger, redactObject } from '../../utils/cliLogger.js';

const db = new Database(config.dbPath);

cliLogger.info('👤 Creando usuario administrador...');

async function createAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@neocdt.com');
    
    if (existingAdmin) {
      cliLogger.warn('El usuario admin ya existe');
      cliLogger.table(null, [
        { campo: 'Email', valor: '[REDACTED]' },
        { campo: 'Documento', valor: '[REDACTED]' },
        { campo: 'Rol', valor: existingAdmin.role }
      ]);
      cliLogger.info('💡 Puedes usar el admin existente para iniciar sesión.');
      cliLogger.info('🛡️ Registro existente (redactado):', redactObject(existingAdmin));
      db.close();
      return;
    }

    // Crear nuevo admin
    const hashedPassword = await bcrypt.hash('Admin1234', 12);
    const adminId = uuidv4();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, email, password, document_type, document_number,
        phone, role, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      adminId,
      'Administrador NeoCDT',
      'admin@neocdt.com',
      hashedPassword,
      'CC',
      '1000000000',
      '3001234567',
      'admin',
      createdAt,
      createdAt
    );

    cliLogger.success('Usuario administrador creado exitosamente');
    cliLogger.warn('📋 Credenciales de acceso (protegidas):');
    cliLogger.table(null, [
      { campo: 'Tipo de documento', valor: 'CC' },
      { campo: 'Número', valor: '[REDACTED]' },
      { campo: 'Contraseña', valor: '[REDACTED]' }
    ]);
    cliLogger.info('🔐 Actualiza estas credenciales en producción y distribúyelas de forma segura.');
    cliLogger.info('🛡️ Registro creado (redactado):', redactObject({
      id: adminId,
      email: 'admin@neocdt.com',
      document_type: 'CC',
      document_number: '1000000000',
      role: 'admin'
    }));
    
  } catch (error) {
    cliLogger.error('❌ Error al crear administrador', { message: error.message });
  } finally {
    db.close();
    cliLogger.success('🔒 Base de datos cerrada');
  }
}

createAdmin();
