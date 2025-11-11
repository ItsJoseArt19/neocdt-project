// SonarQube Fix: Use node: prefix for native imports
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cliLogger, redactObject } from '../utils/cliLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'neocdt.db'), {
    readonly: true
});

const tableFromRows = (rows, formatter) => {
    if (!rows || rows.length === 0) {
        cliLogger.warn('   ⚠️  No hay registros');
        return;
    }
    const formatted = formatter ? rows.map(formatter) : rows;
    cliLogger.table(null, redactObject(formatted));
};

cliLogger.blank();
cliLogger.info('📊 BASE DE DATOS NEOCDT');
cliLogger.divider(80, '=');

cliLogger.blank();
cliLogger.info('👥 USUARIOS:');
cliLogger.blank();
try {
    const users = db.prepare('SELECT * FROM users').all();
    if (users.length === 0) {
        cliLogger.warn('   ⚠️  No hay usuarios registrados aún.');
    } else {
        tableFromRows(users, (user) => ({
            ID: `${user.id.substring(0, 8)}...`,
            Nombre: user.name,
            Email: '[REDACTED]',
            Documento: '[REDACTED]',
            Teléfono: user.phone ? '[REDACTED]' : 'N/A',
            Rol: user.role,
            Activo: user.is_active ? '✅' : '❌',
            Creado: new Date(user.created_at).toLocaleString('es-CO')
        }));
        cliLogger.info('🛡️ Muestra redactada de usuarios:', redactObject(users.slice(0, 3)));
    }
} catch (error) {
    cliLogger.error('   ❌ Error al leer usuarios', { message: error.message });
}

cliLogger.blank();
cliLogger.info('💰 CDTs:');
cliLogger.blank();
try {
    const cdts = db.prepare('SELECT * FROM cdts').all();
    if (cdts.length === 0) {
        cliLogger.warn('   ⚠️  No hay CDTs creados aún.');
    } else {
        tableFromRows(cdts, (cdt) => ({
            ID: `${cdt.id.substring(0, 8)}...`,
            Monto: `$${cdt.amount.toLocaleString('es-CO')}`,
            Días: cdt.term_days,
            'Tasa (% EA)': cdt.interest_rate,
            'Retorno Estimado': `$${cdt.estimated_return.toLocaleString('es-CO')}`,
            Estado: cdt.status,
            Inicio: new Date(cdt.start_date).toLocaleDateString('es-CO'),
            Fin: new Date(cdt.end_date).toLocaleDateString('es-CO'),
            Renovación: cdt.renovation_option
        }));
    }
} catch (error) {
    cliLogger.error('   ❌ Error al leer CDTs', { message: error.message });
}

cliLogger.blank();
cliLogger.info('📝 LOGS DE AUDITORÍA (Últimos 10):');
cliLogger.blank();
try {
    const logs = db
        .prepare('SELECT * FROM cdt_audit_logs ORDER BY created_at DESC LIMIT 10')
        .all();

    if (logs.length === 0) {
        cliLogger.warn('   ⚠️  No hay logs de auditoría aún.');
    } else {
        tableFromRows(logs, (log) => ({
            ID: `${log.id.substring(0, 8)}...`,
            'CDT ID': `${log.cdt_id.substring(0, 8)}...`,
            Acción: log.action,
            Detalles: log.details ? `${log.details.substring(0, 40)}...` : 'N/A',
            Fecha: new Date(log.created_at).toLocaleString('es-CO')
        }));
    }
} catch (error) {
    cliLogger.error('   ❌ Error al leer logs', { message: error.message });
}

cliLogger.blank();
cliLogger.info('📈 ESTADÍSTICAS:');
cliLogger.blank();
try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalCDTs = db.prepare('SELECT COUNT(*) as count FROM cdts').get().count;
    const activeCDTs = db.prepare("SELECT COUNT(*) as count FROM cdts WHERE status = 'active'").get().count;
    const draftCDTs = db.prepare("SELECT COUNT(*) as count FROM cdts WHERE status = 'draft'").get().count;
    const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM cdts').get().total;
    const totalReturn = db.prepare('SELECT COALESCE(SUM(estimated_return), 0) as total FROM cdts').get().total;

    cliLogger.table(null, [
        { indicador: 'Total Usuarios', valor: totalUsers },
        { indicador: 'Total CDTs', valor: totalCDTs },
        { indicador: 'CDTs Activos', valor: activeCDTs },
        { indicador: 'CDTs Borradores', valor: draftCDTs },
        { indicador: 'Monto Total Invertido', valor: `$${totalAmount.toLocaleString('es-CO')}` },
        { indicador: 'Retorno Estimado Total', valor: `$${totalReturn.toLocaleString('es-CO')}` }
    ]);
} catch (error) {
    cliLogger.error('   ❌ Error al calcular estadísticas', { message: error.message });
}

cliLogger.blank();
cliLogger.info('🏗️  ESTRUCTURA DE TABLAS:');
cliLogger.blank();
try {
    const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all();

    for (const table of tables) {
        cliLogger.info(`📋 Tabla: ${table.name}`);
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        tableFromRows(columns, (column) => ({
            Columna: column.name,
            Tipo: column.type,
            'No Null': column.notnull ? '✅' : '❌',
            Default: column.dflt_value || 'N/A',
            PK: column.pk ? '🔑' : ''
        }));
        cliLogger.blank();
    }
} catch (error) {
    cliLogger.error('   ❌ Error al leer estructura', { message: error.message });
}

db.close();
cliLogger.blank();
cliLogger.success('Base de datos cerrada');
cliLogger.divider(80, '=');
cliLogger.blank();
