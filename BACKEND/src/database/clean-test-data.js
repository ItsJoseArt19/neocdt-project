/**
 * Script para limpiar datos de prueba de la base de datos
 * Mantiene solo el usuario admin con documento 67040168
 * Ejecutar: node src/database/clean-test-data.js
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'neocdt.db');
const db = new Database(dbPath);

console.log('\n🧹 Iniciando limpieza de datos de prueba...\n');

try {
  // Contar datos antes de limpiar
  const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const countCDTs = db.prepare('SELECT COUNT(*) as count FROM cdts').get();
  const countAudit = db.prepare('SELECT COUNT(*) as count FROM cdt_audit_logs').get();
  
  console.log('📊 Estado actual:');
  console.log(`   - Usuarios: ${countUsers.count}`);
  console.log(`   - CDTs: ${countCDTs.count}`);
  console.log(`   - Logs de auditoría: ${countAudit.count}\n`);

  // Iniciar transacción
  db.prepare('BEGIN TRANSACTION').run();

  // 1. Eliminar logs de auditoría de CDTs
  console.log('🗑️  Eliminando logs de auditoría...');
  const deletedAudit = db.prepare('DELETE FROM cdt_audit_logs').run();
  console.log(`   ✓ ${deletedAudit.changes} logs eliminados\n`);

  // 2. Eliminar todos los CDTs
  console.log('🗑️  Eliminando todos los CDTs...');
  const deletedCDTs = db.prepare('DELETE FROM cdts').run();
  console.log(`   ✓ ${deletedCDTs.changes} CDTs eliminados\n`);

  // 3. Eliminar usuarios de testing (mantener solo admin real)
  console.log('🗑️  Eliminando usuarios de prueba...');
  const deletedUsers = db.prepare(`
    DELETE FROM users 
    WHERE document_number != '67040168'
  `).run();
  console.log(`   ✓ ${deletedUsers.changes} usuarios eliminados\n`);

  // Commit de la transacción
  db.prepare('COMMIT').run();

  // Verificar estado final
  const finalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const finalCDTs = db.prepare('SELECT COUNT(*) as count FROM cdts').get();
  const finalAudit = db.prepare('SELECT COUNT(*) as count FROM cdt_audit_logs').get();

  console.log('✅ Limpieza completada\n');
  console.log('📊 Estado final:');
  console.log(`   - Usuarios: ${finalUsers.count}`);
  console.log(`   - CDTs: ${finalCDTs.count}`);
  console.log(`   - Logs de auditoría: ${finalAudit.count}\n`);

  // Mostrar usuario admin que quedó
  const admin = db.prepare(`
    SELECT name, email, document_number, role 
    FROM users 
    WHERE document_number = '67040168'
  `).get();

  if (admin) {
    console.log('👤 Usuario administrador conservado:');
    console.log(`   Nombre: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Documento: CC ${admin.document_number}`);
    console.log(`   Rol: ${admin.role}\n`);
    console.log('💡 Usa este usuario para gestionar nuevos CDTs');
    console.log('🔐 Credenciales: CC 67040168 / Admin123!\n');
  } else {
    console.log('⚠️  No se encontró el usuario admin con documento 67040168');
  }

  console.log('🎯 La base de datos está lista para recibir nuevos usuarios y CDTs reales');

} catch (error) {
  console.error('\n❌ Error durante la limpieza:', error.message);
  try {
    db.prepare('ROLLBACK').run();
    console.log('🔄 Transacción revertida');
  } catch (rollbackError) {
    console.error('⚠️  Error al revertir transacción:', rollbackError.message);
  }
  process.exit(1);
} finally {
  db.close();
  console.log('🔒 Base de datos cerrada\n');
}
