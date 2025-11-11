/**
 * Script para verificar si existe usuario admin con documento 67040168
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'neocdt.db');
const db = new Database(dbPath, { readonly: true });

try {
  console.log('\n🔍 Buscando usuario con documento 67040168...\n');
  
  // Buscar por número de documento
  const userByDoc = db
    .prepare(`
      SELECT 
        id, name, email, document_type, document_number, role, is_active, created_at
      FROM users
      WHERE document_number = ?
    `)
    .get('67040168');

  if (userByDoc) {
    console.log('✅ Usuario encontrado:');
    console.log('   Nombre:', userByDoc.name);
    console.log('   Email:', userByDoc.email);
    console.log('   Documento:', userByDoc.document_type, userByDoc.document_number);
    console.log('   Rol:', userByDoc.role);
    console.log('   Estado:', userByDoc.is_active ? 'Activo' : 'Inactivo');
    console.log('   Creado:', new Date(userByDoc.created_at).toLocaleString('es-CO'));
    
    if (userByDoc.role === 'admin') {
      console.log('\n🎉 El usuario YA es ADMIN. Puedes usarlo para aprobar CDTs.');
    } else {
      console.log('\n⚠️  El usuario existe pero NO es admin. Rol actual:', userByDoc.role);
      console.log('💡 Ejecuta: node src/database/promote-to-admin.js');
    }
  } else {
    console.log('❌ No se encontró usuario con documento 67040168');
    console.log('💡 Necesitas crear este usuario. Ejecuta: node src/database/create-admin-67040168.js');
  }

  // Mostrar todos los admins reales (no de testing)
  console.log('\n📋 Usuarios administradores reales en la BD:\n');
  const admins = db
    .prepare(`
      SELECT 
        name, email, document_number, role, is_active
      FROM users
      WHERE role = 'admin'
        AND name NOT LIKE '%Test%'
        AND name NOT LIKE '%Admin User%'
      ORDER BY created_at DESC
    `)
    .all();

  if (admins.length === 0) {
    console.log('   (No hay admins reales registrados, solo usuarios de testing)');
  } else {
    for (const admin of admins) {
      console.log(`   - ${admin.name}`);
      console.log(`     Doc: ${admin.document_number}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Estado: ${admin.is_active ? 'Activo' : 'Inactivo'}`);
      console.log('');
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
