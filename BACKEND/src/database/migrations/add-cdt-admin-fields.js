/**
 * Script de migración para agregar campos de gestión admin a la tabla CDTs
 * Ejecutar: node src/database/migrations/add-cdt-admin-fields.js
 */

import Database from 'better-sqlite3';
import { config } from '../../config/env.js';
import { cliLogger, redactObject } from '../../utils/cliLogger.js';

const db = new Database(config.dbPath);

cliLogger.info('🔄 Iniciando migración de base de datos...');

try {
  // SonarQube Fix: Use Set instead of Array for column lookup performance
  const tableInfo = db.pragma('table_info(cdts)');
  const columns = new Set(tableInfo.map(col => col.name));

  const newColumns = [
    { name: 'admin_notes', type: 'TEXT' },
    { name: 'reviewed_by', type: 'TEXT' },
    { name: 'reviewed_at', type: 'DATETIME' },
    { name: 'submitted_at', type: 'DATETIME' }
  ];

  let addedColumns = 0;

  for (const { name, type } of newColumns) {
    // SonarQube Fix: Use positive condition instead of negated
    if (columns.has(name)) {
      cliLogger.success(`Columna '${name}' ya existe`);
    } else {
      cliLogger.info('➕ Agregando columna', { name, type });
      db.exec(`ALTER TABLE cdts ADD COLUMN ${name} ${type}`);
      addedColumns++;
    }
  }

  // Actualizar el CHECK constraint de status (remover 'approved')
  cliLogger.blank();
  cliLogger.info('🔄 Actualizando estados permitidos...');
  cliLogger.info('ℹ️  Estados válidos: draft, pending, active, rejected, completed, cancelled');
  cliLogger.warn('⚠️  Nota: SQLite no permite modificar CHECK constraints directamente.');
  cliLogger.warn('   Si hay datos con status="approved", cámbialos manualmente a "active".');

  // Verificar si hay CDTs con status 'approved'
  const approvedCDTs = db.prepare('SELECT COUNT(*) as count FROM cdts WHERE status = ?').get('approved');
  
  if (approvedCDTs.count > 0) {
    cliLogger.blank();
    cliLogger.warn('⚠️  Encontrados CDTs en estado deprecated', { count: approvedCDTs.count });
    cliLogger.info('🔄 Migrando automáticamente a status="active"...');
    
    const result = db.prepare('UPDATE cdts SET status = ? WHERE status = ?').run('active', 'approved');
    cliLogger.success('Migración de estados completada', { affected: result.changes });
  }

  cliLogger.blank();
  cliLogger.success('✅ Migración completada exitosamente!');
  cliLogger.info('📊 Resumen de columnas agregadas', { addedColumns });
  
  // Mostrar estructura actualizada
  cliLogger.blank();
  cliLogger.info('📋 Estructura actual de la tabla CDTs:');
  const updatedTableInfo = db.pragma('table_info(cdts)');
  for (const column of updatedTableInfo) {
    cliLogger.table(null, [{
      Columna: column.name,
      Tipo: column.type,
      'No Null': column.notnull ? '✅' : '❌',
      Default: column.dflt_value || 'N/A',
      PK: column.pk ? '🔑' : ''
    }]);
  }
  cliLogger.info('🛡️ Estructura redactada:', redactObject(updatedTableInfo));

} catch (error) {
  cliLogger.error('❌ Error en la migración', { message: error.message });
  process.exit(1);
} finally {
  db.close();
  cliLogger.success('🔒 Base de datos cerrada');
}
