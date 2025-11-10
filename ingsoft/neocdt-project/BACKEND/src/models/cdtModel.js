import { getDB } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Modelo de datos para CDTs (Certificados de Depósito a Término)
 * Maneja todas las operaciones CRUD con la base de datos
 */
class CDT {
  /**
   * Crea un nuevo CDT en la base de datos
   * @param {Object} cdtData - Datos del CDT a crear
   * @param {string} cdtData.userId - ID del usuario propietario
   * @param {number} cdtData.amount - Monto del CDT
   * @param {number} cdtData.termDays - Plazo en días (30-730)
   * @param {number} cdtData.interestRate - Tasa de interés anual
   * @param {string} cdtData.startDate - Fecha de inicio
   * @param {string} cdtData.endDate - Fecha de vencimiento
   * @param {string} [cdtData.renovationOption='capital'] - Opción de renovación (capital, capital_interest, auto)
   * @param {string} [cdtData.status='draft'] - Estado inicial del CDT
   * @returns {Object} CDT creado con todos sus campos
   */
  // SonarQube Fix: Remove async (better-sqlite3 operations are synchronous)
  static create(cdtData) {
    const db = getDB();
    const { userId, amount, termDays, interestRate, startDate, endDate } = cdtData;
    const status = cdtData.status ?? 'draft';
    const renovationOption = cdtData.renovationOption ?? 'capital';

    const cdtId = uuidv4();
    const createdAt = new Date().toISOString().split('T')[0];
    const estimatedReturn = this.calculateReturn(amount, interestRate, termDays);

    const stmt = db.prepare(`
      INSERT INTO cdts (
        id, user_id, amount, term_days, interest_rate,
        start_date, end_date, estimated_return, renovation_option, status,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      cdtId,
      userId, amount, termDays, interestRate,
      startDate, endDate, estimatedReturn, renovationOption, status,
      createdAt, createdAt
    );

    if (info.changes === 0) {
      throw new Error('Failed to create CDT');
    }

    return this.findById(cdtId);
  }

  /**
   * Busca un CDT por su ID
   * Incluye información del usuario propietario mediante JOIN
   * @param {string} id - UUID del CDT
   * @returns {Object|null} CDT encontrado o null
   */
  // SonarQube Fix: Remove async (no await inside, better-sqlite3 is synchronous)
  static findById(id) {
    const db = getDB();
    const stmt = db.prepare(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM cdts c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);

    const cdt = stmt.get(id);
    return cdt ? this.formatCDT(cdt) : null;
  }

  /**
   * Busca todos los CDTs de un usuario específico
   * Soporta paginación y filtrado por estado
   * @param {string} userId - UUID del usuario
   * @param {Object} [filters={}] - Filtros de búsqueda
   * @param {string} [filters.status] - Estado del CDT (draft, active, cancelled, completed)
   * @param {number} [filters.limit=20] - Cantidad máxima de resultados
   * @param {number} [filters.offset=0] - Desplazamiento para paginación
   * @returns {Array<Object>} Lista de CDTs que cumplen los criterios
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static findByUserId(userId, filters = {}) {
    const db = getDB();
    let query = `
      SELECT c.*
      FROM cdts c
      WHERE c.user_id = ?
    `;
    const params = [userId];

    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY c.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = db.prepare(query);
    const cdts = stmt.all(...params);

    return cdts.map(cdt => this.formatCDT(cdt));
  }

  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static findAll(filters = {}) {
    const db = getDB();
    let query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM cdts c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.userId) {
      query += ' AND c.user_id = ?';
      params.push(filters.userId);
    }

    query += ' ORDER BY c.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = db.prepare(query);
    const cdts = stmt.all(...params);

    return cdts.map(cdt => this.formatCDT(cdt));
  }

  // SonarQube Note: This method recalculates estimated_return; DB operations are synchronous. Still async only because of prior await usage. Removing unnecessary await and async.
  static update(id, updates) {
    const db = getDB();
    const allowedFields = new Set(['amount', 'term_days', 'interest_rate', 'start_date', 'end_date', 'renovation_option', 'status']);
    const updateFields = [];
    const params = [];

    for (const key of Object.keys(updates)) {
      if (allowedFields.has(key)) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Recalcular estimated_return si cambian amount, rate o term
    if (updates.amount || updates.interest_rate || updates.term_days) {
  const current = this.findById(id);
      if (!current) {
        return null;
      }
      const amount = updates.amount || current.amount;
      const rate = updates.interest_rate || current.interestRate;
      const term = updates.term_days || current.termDays;
      
      updateFields.push('estimated_return = ?');
      params.push(this.calculateReturn(amount, rate, term));
    }

    updateFields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const stmt = db.prepare(`
      UPDATE cdts
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    const info = stmt.run(...params);

    if (info.changes === 0) {
      return null;
    }

    return this.findById(id);
  }

  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static updateStatus(id, newStatus, reason = null) {
    const db = getDB();
    const updatedAt = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE cdts
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);

    const info = stmt.run(newStatus, updatedAt, id);

    if (info.changes > 0 && reason) {
      // SonarQube Fix: Remove await (createAuditLog is synchronous)
      this.createAuditLog(id, 'status_change', { 
        newStatus, 
        reason,
        timestamp: updatedAt
      });
    }

    return info.changes > 0;
  }

  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static deleteById(id) {
    const db = getDB();
    const stmt = db.prepare('DELETE FROM cdts WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static count(filters = {}) {
    const db = getDB();
    let query = 'SELECT COUNT(*) as count FROM cdts WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count;
  }

  /**
   * Crea un registro en el log de auditoría de CDT
   * Registra todas las operaciones realizadas sobre un CDT para trazabilidad
   * @param {string} cdtId - UUID del CDT
   * @param {string} action - Acción realizada (created, updated, activated, cancelled, etc.)
   * @param {Object} details - Detalles adicionales de la acción (userId, cambios, etc.)
   * @returns {void}
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static createAuditLog(cdtId, action, details) {
    const db = getDB();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO cdt_audit_logs (id, cdt_id, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, cdtId, action, JSON.stringify(details), createdAt);
  }

  /**
   * Obtiene el historial completo de auditoría de un CDT
   * @param {string} cdtId - UUID del CDT
   * @returns {Array<Object>} Lista de eventos de auditoría ordenados por fecha
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static getAuditLogs(cdtId) {
    const db = getDB();
    const stmt = db.prepare(`
      SELECT * FROM cdt_audit_logs
      WHERE cdt_id = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(cdtId).map(log => ({
      ...log,
      details: JSON.parse(log.details)
    }));
  }

  /**
   * Calcula el retorno estimado de un CDT con interés compuesto
   * Utiliza la fórmula: Capital * (1 + tasa/365)^días - Capital
   * @param {number} amount - Monto principal del CDT
   * @param {number} annualRate - Tasa de interés anual en porcentaje (ej: 8.5)
   * @param {number} days - Plazo en días
   * @returns {number} Ganancia estimada (no incluye el capital inicial)
   */
  static calculateReturn(amount, annualRate, days) {
    // Fórmula: Capital * (1 + tasa/365)^días - Capital
    const dailyRate = annualRate / 100 / 365;
    const finalAmount = amount * Math.pow(1 + dailyRate, days);
    return Number.parseFloat((finalAmount - amount).toFixed(2));
  }

  /**
   * Valida que la transición de estado sea permitida según la máquina de estados
   * Estados: draft -> pending -> active -> completed
   *                           -> rejected/cancelled
   * @param {string} currentStatus - Estado actual del CDT
   * @param {string} newStatus - Estado deseado
   * @returns {boolean} true si la transición es válida, false en caso contrario
   */
  static validateTransition(currentStatus, newStatus) {
    const validTransitions = {
      draft: ['pending', 'cancelled'],
      pending: ['active', 'rejected', 'cancelled'],
      active: ['completed', 'cancelled'],
      rejected: [],
      completed: [],
      cancelled: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Envía un CDT a revisión (draft -> pending)
   * @param {string} cdtId - UUID del CDT
   * @param {string} userId - UUID del usuario que envía
   * @returns {Object} CDT actualizado
   * @throws {Error} Si el CDT no existe, no pertenece al usuario o ya fue enviado
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static submitForReview(cdtId, userId) {
    const db = getDB();
    
    // SonarQube Fix: Remove await (findById is now synchronous)
    const cdt = this.findById(cdtId);
    if (!cdt) {
      throw new Error('CDT no encontrado');
    }
    
    if (cdt.userId !== userId) {
      throw new Error('No tienes permisos para enviar este CDT');
    }
    
    if (cdt.status !== 'draft') {
      throw new Error(`No puedes enviar un CDT con estado '${cdt.status}'`);
    }
    
    // Validar que todos los campos requeridos estén completos
    if (!cdt.amount || !cdt.termDays || !cdt.interestRate || !cdt.startDate) {
      throw new Error('El CDT tiene campos incompletos. Completa todos los datos antes de enviarlo.');
    }
    
    const submittedAt = new Date().toISOString();
    
    const updateSql = [
      'UPDATE cdts',
      'SET status = ?,',
      '    submitted_at = ?,',
      '    updated_at = ?',
      'WHERE id = ?'
    ].join('\n');

    const stmt = db.prepare(updateSql);
    const info = stmt.run('pending', submittedAt, submittedAt, cdtId);
    
    if (info.changes === 0) {
      throw new Error('Error al enviar el CDT a revisión');
    }
    
    // SonarQube Fix: Remove await (createAuditLog is synchronous)
    this.createAuditLog(cdtId, 'submitted_for_review', {
      userId,
      timestamp: submittedAt,
      previousStatus: 'draft'
    });
    
    return this.findById(cdtId);
  }

  /**
   * Aprueba un CDT (pending -> active) - Solo admin
   * @param {string} cdtId - UUID del CDT
   * @param {string} adminId - UUID del admin que aprueba
   * @param {string} [adminNotes=null] - Notas del admin (opcional)
   * @returns {Object} CDT actualizado
   * @throws {Error} Si el CDT no existe o no está en estado pending
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static approve(cdtId, adminId, adminNotes = null) {
    const db = getDB();
    
    // SonarQube Fix: Remove await (findById is synchronous)
    const cdt = this.findById(cdtId);
    if (!cdt) {
      throw new Error('CDT no encontrado');
    }
    
    if (cdt.status !== 'pending') {
      throw new Error(`No puedes aprobar un CDT con estado '${cdt.status}'`);
    }
    
    const reviewedAt = new Date().toISOString();
    
    const updateSql = [
      'UPDATE cdts',
      'SET status = ?,',
      '    reviewed_by = ?,',
      '    reviewed_at = ?,',
      '    admin_notes = ?,',
      '    updated_at = ?',
      'WHERE id = ?'
    ].join('\n');

    const stmt = db.prepare(updateSql);
    const info = stmt.run('active', adminId, reviewedAt, adminNotes, reviewedAt, cdtId);
    
    if (info.changes === 0) {
      throw new Error('Error al aprobar el CDT');
    }
    
    // SonarQube Fix: Remove await (createAuditLog is synchronous)
    this.createAuditLog(cdtId, 'approved', {
      adminId,
      adminNotes,
      timestamp: reviewedAt,
      previousStatus: 'pending'
    });
    
    return this.findById(cdtId);
  }

  /**
   * Rechaza un CDT (pending -> rejected) - Solo admin
   * @param {string} cdtId - UUID del CDT
   * @param {string} adminId - UUID del admin que rechaza
   * @param {string} adminNotes - Razón del rechazo (requerido)
   * @returns {Object} CDT actualizado
   * @throws {Error} Si el CDT no existe, no está pending o no hay razón
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static reject(cdtId, adminId, adminNotes) {
    const db = getDB();
    
    if (!adminNotes || adminNotes.trim().length === 0) {
      throw new Error('Debes proporcionar una razón para rechazar el CDT');
    }
    
    // SonarQube Fix: Remove await (findById is synchronous)
    const cdt = this.findById(cdtId);
    if (!cdt) {
      throw new Error('CDT no encontrado');
    }
    
    if (cdt.status !== 'pending') {
      throw new Error(`No puedes rechazar un CDT con estado '${cdt.status}'`);
    }
    
    const reviewedAt = new Date().toISOString();
    
    const updateSql = [
      'UPDATE cdts',
      'SET status = ?,',
      '    reviewed_by = ?,',
      '    reviewed_at = ?,',
      '    admin_notes = ?,',
      '    updated_at = ?',
      'WHERE id = ?'
    ].join('\n');

    const stmt = db.prepare(updateSql);
    const info = stmt.run('rejected', adminId, reviewedAt, adminNotes, reviewedAt, cdtId);
    
    if (info.changes === 0) {
      throw new Error('Error al rechazar el CDT');
    }
    
    // SonarQube Fix: Remove await (createAuditLog is synchronous)
    this.createAuditLog(cdtId, 'rejected', {
      adminId,
      adminNotes,
      timestamp: reviewedAt,
      previousStatus: 'pending'
    });
    
    return this.findById(cdtId);
  }

  /**
   * Cancela un CDT (pending/active -> cancelled)
   * @param {string} cdtId - UUID del CDT
   * @param {string} userId - UUID del usuario
   * @param {string} userRole - Rol del usuario (user/admin)
   * @param {string} reason - Razón de la cancelación
   * @returns {Object} CDT actualizado
   * @throws {Error} Si el CDT no existe o no se puede cancelar
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static cancel(cdtId, userId, userRole, reason) {
    const db = getDB();
    
    // SonarQube Fix: Remove await (findById is synchronous)
    const cdt = this.findById(cdtId);
    if (!cdt) {
      throw new Error('CDT no encontrado');
    }
    
    // Usuarios normales solo pueden cancelar sus propios CDTs en estado pending
    if (userRole !== 'admin' && cdt.userId !== userId) {
      throw new Error('No tienes permisos para cancelar este CDT');
    }
    
    if (userRole !== 'admin' && cdt.status !== 'pending') {
      throw new Error('Solo puedes cancelar CDTs en estado pendiente. Contacta con un administrador.');
    }
    
    // Admin puede cancelar pending o active
    if (!['pending', 'active'].includes(cdt.status)) {
      throw new Error(`No puedes cancelar un CDT con estado '${cdt.status}'`);
    }
    
    const cancelledAt = new Date().toISOString();
    
    const updateSql = [
      'UPDATE cdts',
      'SET status = ?,',
      '    admin_notes = ?,',
      '    updated_at = ?',
      'WHERE id = ?'
    ].join('\n');

    const stmt = db.prepare(updateSql);
    const info = stmt.run('cancelled', reason, cancelledAt, cdtId);
    
    if (info.changes === 0) {
      throw new Error('Error al cancelar el CDT');
    }
    
    // SonarQube Fix: Remove await (createAuditLog is synchronous)
    this.createAuditLog(cdtId, 'cancelled', {
      userId,
      userRole,
      reason,
      timestamp: cancelledAt,
      previousStatus: cdt.status
    });
    
    return this.findById(cdtId);
  }

  /**
   * Completa un CDT cuando llega a su fecha de vencimiento (active -> completed)
   * @param {string} cdtId - UUID del CDT
   * @returns {Object} CDT actualizado
   * @throws {Error} Si el CDT no existe o no está activo
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static complete(cdtId) {
    const db = getDB();
    
    // SonarQube Fix: Remove await (findById is synchronous)
    const cdt = this.findById(cdtId);
    if (!cdt) {
      throw new Error('CDT no encontrado');
    }
    
    if (cdt.status !== 'active') {
      throw new Error(`No puedes completar un CDT con estado '${cdt.status}'`);
    }
    
    const completedAt = new Date().toISOString();
    
    const updateSql = [
      'UPDATE cdts',
      'SET status = ?,',
      '    updated_at = ?',
      'WHERE id = ?'
    ].join('\n');

    const stmt = db.prepare(updateSql);
    const info = stmt.run('completed', completedAt, cdtId);
    
    if (info.changes === 0) {
      throw new Error('Error al completar el CDT');
    }
    
    // SonarQube Fix: Remove await (createAuditLog is synchronous)
    this.createAuditLog(cdtId, 'completed', {
      timestamp: completedAt,
      previousStatus: 'active',
      finalAmount: cdt.amount + cdt.estimatedReturn
    });
    
    return this.findById(cdtId);
  }

  /**
   * Obtiene CDTs filtrados por estado
   * @param {string} status - Estado a filtrar (pending, active, etc.)
   * @param {string} [userId=null] - Filtrar por usuario (opcional)
   * @returns {Array<Object>} Lista de CDTs
   */
  // SonarQube Fix: Remove async (delegates to synchronous findAll)
  static findByStatus(status, userId = null) {
    const filters = { status };
    if (userId) {
      filters.userId = userId;
    }
    return this.findAll(filters);
  }

  /**
   * Obtiene todos los CDTs con filtros avanzados (para admin)
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} [filters.status] - Filtrar por estado
   * @param {string} [filters.userId] - Filtrar por usuario
   * @param {string} [filters.startDate] - Fecha de inicio desde
   * @param {string} [filters.endDate] - Fecha de inicio hasta
   * @returns {Array<Object>} Lista de CDTs
   */
  // SonarQube Fix: Remove async (better-sqlite3 is synchronous)
  static findAllForAdmin(filters = {}) {
    const db = getDB();
    let query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email,
        u.document_type as user_document_type,
        u.document_number as user_document_number,
        admin.name as reviewed_by_name
      FROM cdts c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users admin ON c.reviewed_by = admin.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.userId) {
      query += ' AND c.user_id = ?';
      params.push(filters.userId);
    }

    if (filters.startDate) {
      query += ' AND c.start_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND c.start_date <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY c.submitted_at DESC, c.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    const cdts = stmt.all(...params);

    return cdts.map(cdt => ({
      ...this.formatCDT(cdt),
      userDocumentType: cdt.user_document_type,
      userDocumentNumber: cdt.user_document_number,
      reviewedByName: cdt.reviewed_by_name,
      adminNotes: cdt.admin_notes,
      reviewedBy: cdt.reviewed_by,
      reviewedAt: cdt.reviewed_at,
      submittedAt: cdt.submitted_at
    }));
  }

  /**
   * Verifica si un usuario puede realizar una transición de estado en un CDT
   * @param {string} cdtId - UUID del CDT
   * @param {string} userId - UUID del usuario
   * @param {string} userRole - Rol del usuario
   * @param {string} newStatus - Estado al que se quiere transicionar
   * @returns {Object} { canTransition: boolean, reason: string }
   */
  // SonarQube Fix: Remove async (method is fully synchronous)
  static canTransitionTo(cdtId, userId, userRole, newStatus) {
    // SonarQube Fix: Remove await (findById is synchronous)
    const cdt = this.findById(cdtId);
    
    if (!cdt) {
      return { canTransition: false, reason: 'CDT no encontrado' };
    }
    
    // Verificar propiedad del CDT
    if (userRole !== 'admin' && cdt.userId !== userId) {
      return { canTransition: false, reason: 'No tienes permisos sobre este CDT' };
    }
    
    // Verificar transición válida
    if (!this.validateTransition(cdt.status, newStatus)) {
      return { 
        canTransition: false, 
        reason: `No puedes cambiar de '${cdt.status}' a '${newStatus}'` 
      };
    }
    
    // Reglas específicas por rol
    if (newStatus === 'active' && userRole !== 'admin') {
      return { 
        canTransition: false, 
        reason: 'Solo administradores pueden aprobar CDTs' 
      };
    }
    
    if (newStatus === 'rejected' && userRole !== 'admin') {
      return { 
        canTransition: false, 
        reason: 'Solo administradores pueden rechazar CDTs' 
      };
    }
    
    return { canTransition: true, reason: null };
  }

  static formatCDT(cdt) {
    if (!cdt) return null;

    return {
      id: cdt.id,
      userId: cdt.user_id,
      userName: cdt.user_name,
      userEmail: cdt.user_email,
      userDocumentType: cdt.user_document_type,
      userDocumentNumber: cdt.user_document_number,
      userDocument: cdt.user_document_type && cdt.user_document_number 
        ? `${cdt.user_document_type} ${cdt.user_document_number}` 
        : null,
      amount: Number.parseFloat(cdt.amount),
      termDays: cdt.term_days,
      termMonths: Math.floor(cdt.term_days / 30),
      interestRate: Number.parseFloat(cdt.interest_rate),
      startDate: cdt.start_date,
      endDate: cdt.end_date,
      estimatedReturn: Number.parseFloat(cdt.estimated_return),
      renovationOption: cdt.renovation_option,
      status: cdt.status,
      adminNotes: cdt.admin_notes || null,
      reviewedBy: cdt.reviewed_by || null,
      reviewedByName: cdt.reviewed_by_name || null,
      reviewedAt: cdt.reviewed_at || null,
      submittedAt: cdt.submitted_at || null,
      createdAt: cdt.created_at,
      updatedAt: cdt.updated_at
    };
  }
}

export default CDT;
