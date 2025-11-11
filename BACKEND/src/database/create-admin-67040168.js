/**
 * Script para crear usuario admin con documento 67040168
 * Ejecutar: node src/database/create-admin-67040168.js
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'neocdt.db');
const db = new Database(dbPath);

console.log('\n👤 Creando usuario administrador con documento 67040168...\n');

async function createAdmin() {
  try {
    // Verificar si ya existe
    const existing = db
      .prepare('SELECT * FROM users WHERE document_number = ?')
      .get('67040168');
    
    if (existing) {
      console.log('⚠️  Usuario con documento 67040168 ya existe:');
      console.log('   Nombre:', existing.name);
      console.log('   Email:', existing.email);
      console.log('   Rol:', existing.role);
      
      if (existing.role !== 'admin') {
        console.log('\n🔄 Promoviendo usuario a rol admin...');
        db.prepare('UPDATE users SET role = ? WHERE document_number = ?')
          .run('admin', '67040168');
        console.log('✅ Usuario promovido a admin exitosamente');
      } else {
        console.log('\n✅ El usuario ya es admin');
      }
      
      db.close();
      return;
    }

    // Crear nuevo admin con contraseña del manual: Admin123!
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const adminId = uuidv4();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, email, password, document_type, document_number,
        phone, role, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      adminId,
      'Administrador NeoCDT',
      'admin67040168@neocdt.com',
      hashedPassword,
      'CC',
      '67040168',
      '3001234567',
      'admin',
      1,  // is_active = true
      createdAt,
      createdAt
    );

    console.log('✅ Usuario administrador creado exitosamente\n');
    console.log('📋 Credenciales de acceso:');
    console.log('   ┌─────────────────────────────────────┐');
    console.log('   │ Tipo de documento: CC               │');
    console.log('   │ Número: 67040168                    │');
    console.log('   │ Contraseña: Admin123!               │');
    console.log('   └─────────────────────────────────────┘');
    console.log('\n💡 Usa estas credenciales para iniciar sesión como admin');
    console.log('🔐 Cambia la contraseña en producción para mayor seguridad');
    
    // Verificar que se creó correctamente
    const created = db
      .prepare('SELECT name, email, document_number, role FROM users WHERE document_number = ?')
      .get('67040168');
    
    console.log('\n✓ Verificado en la base de datos:');
    console.log('   Nombre:', created.name);
    console.log('   Email:', created.email);
    console.log('   Documento:', created.document_number);
    console.log('   Rol:', created.role);
    
  } catch (error) {
    console.error('\n❌ Error al crear administrador:', error.message);
    process.exit(1);
  } finally {
    db.close();
    console.log('\n🔒 Base de datos cerrada');
  }
}

createAdmin();
