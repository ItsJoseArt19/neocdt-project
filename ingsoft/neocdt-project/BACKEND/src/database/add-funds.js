/**
 * Script para agregar fondos a una cuenta de usuario
 * Uso: node add-funds.js <documento> <monto>
 * Ejemplo: node add-funds.js CC-1234567890 5000000
 */

// SonarQube Fix: Use node: prefix for native imports
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cliLogger, redactObject } from '../utils/cliLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'neocdt.db');
const db = new Database(dbPath);

const [, , documentNumber, amount] = process.argv;

const showUsage = () => {
    cliLogger.error('Uso incorrecto', { code: 'INVALID_CLI_ARGUMENTS' });
    cliLogger.blank();
    const usageLines = [
        '📝 Uso correcto:',
        '   node add-funds.js <documento> <monto>',
        '',
        '📌 Ejemplos:',
        '   node add-funds.js CC-1234567890 5000000',
        '   node add-funds.js CC-6704016888 10000000'
    ];
    for (const line of usageLines) {
        cliLogger.info(line);
    }
};

if (!documentNumber || !amount) {
    showUsage();
    process.exit(1);
}

const numericAmount = Number.parseFloat(amount);

if (Number.isNaN(numericAmount) || numericAmount < 0) {
    cliLogger.error('El monto debe ser un número válido mayor o igual a 0', { amount });
    process.exit(1);
}

try {
    const user = db
        .prepare(`
                SELECT id, name, email, document_number, document_type 
                FROM users 
                WHERE document_number = ?
        `)
        .get(documentNumber);

    if (!user) {
        cliLogger.error('Usuario no encontrado', { documentNumber });
        cliLogger.blank();
        cliLogger.info('💡 Verifica que el documento esté correcto');
        cliLogger.info('💡 Puedes ver todos los usuarios ejecutando: node view-users.js');
        process.exit(1);
    }

    cliLogger.blank();
    cliLogger.success('Usuario encontrado');
    cliLogger.table(null, redactObject([
        { campo: 'Nombre', valor: user.name },
        { campo: 'Email', valor: user.email },
        { campo: 'Documento', valor: `${user.document_type}-${user.document_number}` }
    ]));

    cliLogger.blank();
    cliLogger.info('💰 Opciones disponibles para el usuario:');
    cliLogger.info('   1. Crear CDTs directamente desde la interfaz');
    cliLogger.info('   2. El backend validará los montos según las reglas de negocio');
    cliLogger.blank();
    cliLogger.info(`✨ Monto disponible a simular: $${numericAmount.toLocaleString('es-CO')}`);
    cliLogger.blank();
    cliLogger.info('💡 NOTA: El sistema actual no tiene tabla de fondos disponibles.');
    cliLogger.info('   Los CDTs se crean directamente sin verificar balance previo.');
    cliLogger.info('   Esto es normal para un sistema bancario donde el balance se verifica');
    cliLogger.info('   contra cuentas externas o sistemas contables.');
    cliLogger.blank();

    cliLogger.info('🛡️ Datos del usuario (redactados):', redactObject(user));
} catch (error) {
    cliLogger.error('Error inesperado al procesar la solicitud', { message: error.message });
    process.exit(1);
} finally {
    db.close();
}
