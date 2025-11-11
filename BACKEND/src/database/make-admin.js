// SonarQube Fix: Use node: prefix for native imports
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cliLogger, redactObject } from '../utils/cliLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'neocdt.db'));

try {
  const result = db
    .prepare(`
      UPDATE users 
      SET role = 'admin' 
      WHERE document_number = '6704016888'
    `)
    .run();

  cliLogger.success('Usuario actualizado a rol administrador', { affectedRows: result.changes });

  const user = db
    .prepare(`
      SELECT name, email, document_type, document_number, role 
      FROM users 
      WHERE document_number = '6704016888'
    `)
    .get();

  if (user) {
    cliLogger.blank();
    cliLogger.info('📋 Usuario Admin:');
    cliLogger.table(null, redactObject([
      { campo: 'Nombre', valor: user.name },
      { campo: 'Documento', valor: '[REDACTED]' },
      { campo: 'Rol', valor: user.role }
    ]));
    cliLogger.blank();
    cliLogger.warn('🔐 Credenciales para login (no se exponen valores sensibles)');
    cliLogger.table(null, redactObject([
      { campo: 'documentType', valor: 'CC' },
  { campo: 'documentNumber', valor: '[REDACTED]' },
      { campo: 'password', valor: '[REDACTED]' }
    ]));
    cliLogger.info('🛡️ Datos redactados:', redactObject(user));
  } else {
    cliLogger.warn('No se encontró el usuario objetivo', {
      documentNumber: '6704016888'
    });
  }
} catch (error) {
  cliLogger.error('Error al promover el usuario', { message: error.message });
  process.exitCode = 1;
} finally {
  db.close();
}
