/**
 * Script para ver todos los usuarios registrados
 * Uso: node view-users.js
 */

// SonarQube Fix: Use node: prefix for native imports
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cliLogger, redactObject } from '../utils/cliLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'neocdt.db');
const db = new Database(dbPath, { readonly: true });

const describeUser = (user, index) => {
    cliLogger.info(`${index + 1}. ${user.name}`);
    cliLogger.info(`   👤 Rol: ${user.role}`);
    cliLogger.info(`   Estado: ${user.is_active ? '✅ Activo' : '❌ Inactivo'}`);
    cliLogger.info(`   📅 Creado: ${new Date(user.created_at).toLocaleString('es-CO')}`);
    cliLogger.info('   Datos sensibles: [REDACTED]');
    cliLogger.info('');
};

const describeCdts = (row, index) => {
    cliLogger.info(`${index + 1}. ${row.name} (${row.document_number})`);
    cliLogger.table(null, redactObject([
        { métrica: 'Total CDTs', valor: row.total_cdts },
        { métrica: 'Borradores', valor: row.draft },
        { métrica: 'Pendientes', valor: row.pending },
        { métrica: 'Activos', valor: row.active },
        { métrica: 'Rechazados', valor: row.rejected },
        { métrica: 'Completados', valor: row.completed },
        { métrica: 'Cancelados', valor: row.cancelled },
        { métrica: 'Total invertido', valor: `$${(row.total_invested || 0).toLocaleString('es-CO')}` }
    ]));
    cliLogger.blank();
};

try {
    cliLogger.blank();
    cliLogger.info('👥 ===== USUARIOS REGISTRADOS =====');
    cliLogger.blank();

    const users = db
        .prepare(`
                SELECT 
                        id,
                        name,
                        email,
                        document_type,
                        document_number,
                        role,
                        is_active,
                        created_at
                FROM users
                ORDER BY created_at DESC
        `)
        .all();

    if (users.length === 0) {
        cliLogger.warn('No hay usuarios registrados');
        cliLogger.info('💡 Registra un usuario desde: http://localhost:5174/register');
    } else {
        for (const user of users) {
            describeUser(user);
        }
        cliLogger.success(`Total: ${users.length} usuario(s)`);
        cliLogger.info('🛡️ Datos de usuarios (muestra redactada):', redactObject(users.slice(0, 2)));
    }

    cliLogger.blank();
    cliLogger.info('📊 ===== CDTs POR USUARIO =====');
    cliLogger.blank();

    const cdtsPerUser = db
        .prepare(`
                SELECT 
                        u.name,
                        u.document_number,
                        COUNT(c.id) as total_cdts,
                        SUM(CASE WHEN c.status = 'draft' THEN 1 ELSE 0 END) as draft,
                        SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN c.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                        SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN c.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                        SUM(c.amount) as total_invested
                FROM users u
                LEFT JOIN cdts c ON u.id = c.user_id
                GROUP BY u.id, u.name, u.document_number
                HAVING total_cdts > 0
                ORDER BY total_cdts DESC
        `)
        .all();

    if (cdtsPerUser.length === 0) {
        cliLogger.warn('No hay CDTs creados');
        cliLogger.info('💡 Crea un CDT desde: http://localhost:5174/crear-cdt');
    } else {
        for (const cdtData of cdtsPerUser) {
            describeCdts(cdtData);
        }
    }
} catch (error) {
    cliLogger.error('Error al consultar usuarios', { message: error.message });
    process.exit(1);
} finally {
    db.close();
}
