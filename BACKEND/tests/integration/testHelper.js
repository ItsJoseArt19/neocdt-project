import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testDb = null;

export const setupTestDatabase = () => {
  // Crear base de datos en memoria para tests
  testDb = new Database(':memory:');
  
  // Configurar pragmas para mejor rendimiento en tests
  testDb.pragma('journal_mode = MEMORY');
  testDb.pragma('synchronous = OFF');
  testDb.pragma('foreign_keys = ON');
  
  // Crear tablas
  initializeTables();
  
  return testDb;
};

const initializeTables = () => {
  // Tabla de usuarios
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      document_type TEXT,
      document_number TEXT,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      refresh_token TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de CDTs
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS cdts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      term_months INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      estimated_return REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabla de auditoría de CDTs
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS cdt_audit_logs (
      id TEXT PRIMARY KEY,
      cdt_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cdt_id) REFERENCES cdts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Índices
  testDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_cdts_user_id ON cdts(user_id);
    CREATE INDEX IF NOT EXISTS idx_cdts_status ON cdts(status);
    CREATE INDEX IF NOT EXISTS idx_audit_cdt_id ON cdt_audit_logs(cdt_id);
  `);
};

export const getTestDB = () => {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return testDb;
};

export const clearTestDatabase = () => {
  if (testDb) {
    // Limpiar todas las tablas
    testDb.exec('DELETE FROM cdt_audit_logs');
    testDb.exec('DELETE FROM cdts');
    testDb.exec('DELETE FROM users');
  }
};

export const closeTestDatabase = () => {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
};

export const seedTestUsers = async () => {
  const bcrypt = await import('bcryptjs');
  const { v4: uuidv4 } = await import('uuid');
  
  const hashedPassword = await bcrypt.default.hash('Password123!', 12);
  
  const adminId = uuidv4();
  const userId = uuidv4();
  
  // Usuario admin
  testDb.prepare(`
    INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(adminId, 'Admin User', 'admin@neocdt.com', hashedPassword, 'admin', 1);
  
  // Usuario normal
  testDb.prepare(`
    INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(userId, 'Test User', 'test@neocdt.com', hashedPassword, 'user', 1);
  
  return { adminId, userId };
};

export const seedTestCDT = (userId, overrides = {}) => {
  const { v4: uuidv4 } = require('uuid');
  
  const cdtId = uuidv4();
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const cdtData = {
    id: cdtId,
    user_id: userId,
    amount: 10000000,
    term_months: 12,
    interest_rate: 8.5,
    start_date: startDate,
    end_date: endDate,
    estimated_return: 885000,
    status: 'draft',
    ...overrides
  };
  
  testDb.prepare(`
    INSERT INTO cdts (id, user_id, amount, term_months, interest_rate, start_date, end_date, estimated_return, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    cdtData.id,
    cdtData.user_id,
    cdtData.amount,
    cdtData.term_months,
    cdtData.interest_rate,
    cdtData.start_date,
    cdtData.end_date,
    cdtData.estimated_return,
    cdtData.status
  );
  
  return cdtData;
};

// Mock del módulo database para tests
export const mockDatabaseModule = () => {
  const db = getTestDB();
  
  return {
    getDB: () => db,
    connectDB: () => db,
    closeDB: () => {},
    initializeTables: () => {}
  };
};
