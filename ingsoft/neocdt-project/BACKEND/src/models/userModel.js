import { getDB } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Modelo de Usuario con validación de documentos colombianos
 * Soporta CC, CE, NIT y PA
 */
class User {
  /**
   * Crea un nuevo usuario con tipo y número de documento
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.name - Nombre completo
   * @param {string} userData.email - Email único
   * @param {string} userData.password - Contraseña en texto plano
   * @param {string} [userData.documentType='CC'] - Tipo de documento (CC, CE)
   * @param {string} [userData.documentNumber] - Número de documento
   * @param {string} [userData.phone] - Teléfono celular (10 dígitos)
   * @param {string} [userData.nationality] - Nacionalidad (requerido para CE)
   * @param {string} [userData.residenceDate] - Fecha de residencia (requerido para CE)
   * @param {string} [userData.role='user'] - Rol del usuario
   * @returns {Object} Usuario creado sin password
   */
  static async create(userData) {
    const db = getDB();
    // Destructure with explicit defaults to satisfy linters
    const { name, email, password } = userData;
    const documentType = userData.documentType ?? 'CC';
    const documentNumber = userData.documentNumber ?? null;
    const phone = userData.phone ?? null;
    const nationality = userData.nationality ?? null;
    const residenceDate = userData.residenceDate ?? null;
    const role = userData.role ?? 'user';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, email, password, document_type, document_number, 
        phone, nationality, residence_date, role, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      id, name, email, hashedPassword, documentType, documentNumber,
      phone, nationality, residenceDate, role, createdAt, createdAt
    );

    if (info.changes === 0) {
      throw new Error('Failed to create user');
    }

    return this.findById(id);
  }

  static async findById(id) {
    const db = getDB();
    const stmt = db.prepare(`
      SELECT id, name, email, document_type, document_number, 
             phone, nationality, residence_date, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `);

    const user = stmt.get(id);
    return user ? this.formatUser(user) : null;
  }

  static async findByEmail(email, includePassword = false) {
    const db = getDB();
    const baseFields = 'id, name, email, document_type, document_number, phone, nationality, residence_date, role, is_active, created_at, updated_at';
    const fields = includePassword ? `${baseFields}, password, refresh_token` : baseFields;

    const stmt = db.prepare(`
      SELECT ${fields}
      FROM users
      WHERE email = ?
    `);

    const user = stmt.get(email);
    if (!user) return null;
    return this.formatUser(user);
  }

  /**
   * Busca un usuario por tipo y número de documento
   * @param {string} documentType - Tipo de documento (CC, CE)
   * @param {string} documentNumber - Número de documento
   * @param {boolean} [includePassword=false] - Si incluir el password hasheado
   * @returns {Object|null} Usuario encontrado o null
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static findByDocument(documentType, documentNumber, includePassword = false) {
    const db = getDB();
    const baseFields = 'id, name, email, document_type, document_number, phone, nationality, residence_date, role, is_active, created_at, updated_at';
    const fields = includePassword ? `${baseFields}, password, refresh_token` : baseFields;

    const stmt = db.prepare(`
      SELECT ${fields}
      FROM users
      WHERE document_type = ? AND document_number = ?
    `);

    const user = stmt.get(documentType, documentNumber);
    if (!user) return null;
    return this.formatUser(user);
  }

  static async findAll(filters = {}) {
    const db = getDB();
    const baseQuery = [
      'SELECT id, name, email, document_type, document_number, phone, nationality, residence_date, role, is_active, created_at, updated_at',
      'FROM users',
      'WHERE 1=1'
    ];

    const { clauses, params } = this._buildFilterClauses(filters);
    for (const clause of clauses) {
      baseQuery.push(`AND ${clause}`);
    }

    baseQuery.push('ORDER BY created_at DESC');

    const { query, finalParams } = this._applyPagination(baseQuery.join(' '), params, filters);
    const stmt = db.prepare(query);
    const users = stmt.all(...finalParams);

    return this._formatUsers(users);
  }

  static async update(id, updates) {
    const db = getDB();
    const allowedFields = new Set(['name', 'email', 'document_type', 'document_number', 'phone', 'nationality', 'residence_date', 'role', 'is_active']);
    const updateFields = [];
    const params = [];

    for (const key of Object.keys(updates)) {
      if (allowedFields.has(key)) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }

    if (updateFields.length === 0) throw new Error('No valid fields to update');

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = db.prepare(`
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    const info = stmt.run(...params);

    if (info.changes === 0) return null;

    return this.findById(id);
  }

  static async updatePassword(id, newPassword) {
    const db = getDB();
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const stmt = db.prepare(`
      UPDATE users
      SET password = ?, updated_at = ?
      WHERE id = ?
    `);

    const info = stmt.run(hashedPassword, new Date().toISOString(), id);
    return info.changes > 0;
  }

  static async updateRefreshToken(id, refreshToken) {
    const db = getDB();
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 12) : null;
    const stmt = db.prepare(`
      UPDATE users
      SET refresh_token = ?, updated_at = ?
      WHERE id = ?
    `);

    const info = stmt.run(hashedToken, new Date().toISOString(), id);
    return info.changes > 0;
  }

  static async deleteById(id) {
    const db = getDB();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async count(filters = {}) {
    const db = getDB();
    const baseQuery = ['SELECT COUNT(*) as count FROM users WHERE 1=1'];
    const { clauses, params } = this._buildFilterClauses(filters);
    for (const clause of clauses) {
      baseQuery.push(`AND ${clause}`);
    }

    const stmt = db.prepare(baseQuery.join(' '));
    const result = stmt.get(...params);
    return result.count;
  }

  static _buildFilterClauses(filters = {}) {
    const clauses = [];
    const params = [];

    if (filters.role) {
      clauses.push('role = ?');
      params.push(filters.role);
    }

    if (typeof filters.isActive === 'boolean') {
      clauses.push('is_active = ?');
      params.push(filters.isActive ? 1 : 0);
    }

    return { clauses, params };
  }

  static _applyPagination(query, params, filters = {}) {
    const finalParams = [...params];
    let finalQuery = query;

    const limit = this._toPositiveInteger(filters.limit);
    if (limit !== null) {
      finalQuery += ' LIMIT ?';
      finalParams.push(limit);
    }

    const offset = this._toNonNegativeInteger(filters.offset);
    if (offset !== null) {
      finalQuery += ' OFFSET ?';
      finalParams.push(offset);
    }

    return { query: finalQuery, finalParams };
  }

  static _toPositiveInteger(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  static _toNonNegativeInteger(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return null;
    }
    return parsed;
  }

  static _formatUsers(rows) {
    if (!rows || rows.length === 0) {
      return [];
    }
    return rows.map((row) => this.formatUser(row));
  }

  static formatUser(user) {
    if (!user) return null;

    const formatted = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    // Campos opcionales
    if (user.phone) formatted.phone = user.phone;
    if (user.document_type) formatted.documentType = user.document_type;
    if (user.document_number) formatted.documentNumber = user.document_number;
    if (user.nationality) formatted.nationality = user.nationality;
    if (user.residence_date) formatted.residenceDate = user.residence_date;
    
    // Solo incluir refresh_token si está presente (para login)
    if (user.refresh_token) formatted.refreshToken = user.refresh_token;
    
    // Incluir password si está presente (solo cuando se solicita explícitamente)
    if (user.password) formatted.password = user.password;

    return formatted;
  }
}

export default User;
