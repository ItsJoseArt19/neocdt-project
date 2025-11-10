import Database from 'better-sqlite3';
import { config } from './env.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { access, mkdir } from 'fs/promises';
import { logger, logDatabase } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use an object holder to avoid bare identifier re-assignment (cleaner for linters)
const state = { db: null };

export const connectDB = async () => {
  try {
    // Crear directorio de base de datos si no existe (async)
    const dbDir = dirname(config.dbPath);
    try {
      await access(dbDir);
    } catch {
      await mkdir(dbDir, { recursive: true });
    }

    // Crear directorio de backups si no existe (async)
    if (config.dbBackupPath) {
      try {
        await access(config.dbBackupPath);
      } catch {
        await mkdir(config.dbBackupPath, { recursive: true });
      }
    }

    // Conectar a SQLite
    const dbInstance = new Database(config.dbPath, {
      verbose: config.nodeEnv === 'development' ? (msg) => logger.debug(msg) : null
    });
    state.db = dbInstance;

    // Habilitar foreign keys
  state.db.pragma('foreign_keys = ON');
    
    // Configurar para mejor performance
  state.db.pragma('journal_mode = WAL');
  state.db.pragma('synchronous = NORMAL');

    logDatabase('connect', { path: config.dbPath, mode: 'WAL', status: 'connected' });
    
    // Inicializar tablas
    initializeTables();
    
    return state.db;
  } catch (error) {
    logger.error('Error connecting to SQLite database', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

const initializeTables = () => {
  // Crear tabla de usuarios con campos de documento, teléfono, nacionalidad y fecha de residencia
  state.db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      document_type TEXT DEFAULT 'CC' CHECK(document_type IN ('CC', 'CE')),
      document_number TEXT,
      phone TEXT,
      nationality TEXT,
      residence_date TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      is_active INTEGER DEFAULT 1,
      refresh_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(document_type, document_number)
    )
  `);

  // Crear tabla de CDTs con opción de renovación y campos de gestión admin
  state.db.exec(`
    CREATE TABLE IF NOT EXISTS cdts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      term_days INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      estimated_return REAL NOT NULL,
      renovation_option TEXT DEFAULT 'capital' CHECK(renovation_option IN ('capital', 'capital_interest', 'auto')),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'active', 'rejected', 'completed', 'cancelled')),
      admin_notes TEXT,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      submitted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Crear tabla de auditoría de CDTs
  state.db.exec(`
    CREATE TABLE IF NOT EXISTS cdt_audit_logs (
      id TEXT PRIMARY KEY,
      cdt_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cdt_id) REFERENCES cdts(id) ON DELETE CASCADE
    )
  `);

  // Crear índices básicos
  state.db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_cdts_user_id ON cdts(user_id);
    CREATE INDEX IF NOT EXISTS idx_cdts_status ON cdts(status);
    CREATE INDEX IF NOT EXISTS idx_cdt_audit_logs_cdt_id ON cdt_audit_logs(cdt_id);
  `);

  // Crear índices compuestos para queries frecuentes (SECURITY + PERFORMANCE)
  state.db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
    CREATE INDEX IF NOT EXISTS idx_cdts_user_status ON cdts(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_cdts_dates ON cdts(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_audit_cdt_created ON cdt_audit_logs(cdt_id, created_at);
  `);

  logDatabase('initialize', { 
    tables: ['users', 'cdts', 'cdt_audit_logs'], 
    indexes: 9, 
    status: 'ready',
    securityIndexes: 4
  });
};

export const getDB = () => {
  if (!state.db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return state.db;
};

export const closeDB = () => {
  if (state.db) {
    state.db.close();
    logDatabase('disconnect', { status: 'closed' });
  }
};

// Crear backup de la base de datos
export const createBackup = () => {
  try {
    if (!state.db) return;
    
    // SonarQube Fix: Use replaceAll() instead of replace() with /g flag
    const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
    const backupPath = `${config.dbBackupPath}/backup-${timestamp}.db`;
    
    state.db.backup(backupPath)
      .then(() => {
        logDatabase('backup', { path: backupPath, status: 'success' });
      })
      .catch(err => {
        logger.error('Database backup failed', { error: err.message, path: backupPath });
      });
  } catch (error) {
    logger.error('Error creating database backup', { error: error.message });
  }
};
