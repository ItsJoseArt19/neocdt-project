/**
 * Script para crear usuarios de prueba para E2E tests
 * Ejecutar: node create-test-users.js
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbDir = join(__dirname, 'src', 'database');
const dbPath = join(dbDir, 'neocdt.db');

// Asegurar que el directorio existe
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

async function createTestUsers() {
  console.log('🔧 Creando usuarios de prueba para E2E tests...\n');

  const testUsers = [
    {
      id: 'test-user-e2e-1',
      name: 'Usuario Test E2E',
      email: 'user@test.com',
      password: 'Test123!@#',
      documentType: 'CC',
      documentNumber: '1234567890',
      phone: '31234567890',
      role: 'user'
    },
    {
      id: 'test-admin-e2e-1',
      name: 'Admin Test E2E',
      email: 'admin@test.com',
      password: 'Admin123!@#',
      documentType: 'CC',
      documentNumber: '9876543210',
      phone: '31987654321',
      role: 'admin'
    },
    {
      id: 'test-user-e2e-2',
      name: 'Usuario Test CE',
      email: 'userCE@test.com',
      password: 'Test123!@#',
      documentType: 'CE',
      documentNumber: '123456789',
      phone: '31456789012',
      nationality: 'Venezuela',
      residenceDate: '2020-01-15',
      role: 'user'
    }
  ];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, name, email, password, document_type, document_number, 
      phone, nationality, residence_date, role, is_active
    ) VALUES (
      @id, @name, @email, @password, @documentType, @documentNumber,
      @phone, @nationality, @residenceDate, @role, 1
    )
  `);

  for (const user of testUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      insertStmt.run({
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        phone: user.phone,
        nationality: user.nationality || null,
        residenceDate: user.residenceDate || null,
        role: user.role
      });

      console.log(`✅ Usuario creado: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Documento: ${user.documentType} ${user.documentNumber}`);
      console.log(`   - Password: ${user.password}`);
      console.log(`   - Rol: ${user.role}\n`);
    } catch (error) {
      console.error(`❌ Error creando usuario ${user.email}:`, error.message);
    }
  }

  console.log('\n✨ Usuarios de prueba creados exitosamente!\n');
  console.log('📝 Credenciales para tests:');
  console.log('Usuario normal:');
  console.log('  - Documento: CC 1234567890');
  console.log('  - Password: Test123!@#\n');
  console.log('Usuario admin:');
  console.log('  - Documento: CC 9876543210');
  console.log('  - Password: Admin123!@#\n');
  console.log('Usuario CE:');
  console.log('  - Documento: CE 123456789');
  console.log('  - Password: Test123!@#\n');

  db.close();
}

createTestUsers().catch(console.error);
