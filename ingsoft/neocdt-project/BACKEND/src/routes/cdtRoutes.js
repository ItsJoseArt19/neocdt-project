import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import adminOnly from '../middlewares/adminMiddleware.js';
import {
  createCDT,
  getMyCDTs,
  getCDTById,
  updateCDT,
  changeStatus,
  cancelCDT,
  deleteCDT,
  getAllCDTs,
  getAuditLog,
  submitCDT,
  approveCDT,
  rejectCDT,
  cancelCDTRequest,
  getPendingCDTs,
  getAllCDTsForAdmin,
  getAdminStats
} from '../controllers/cdtController.js';
import {
  validateCreateCDT,
  validateUpdateCDT,
  validateChangeStatus,
  validateCancelCDT,
  validateCDTId,
  validateCDTFilters
} from '../validators/cdtValidatorNew.js';

const router = express.Router();

// Proteger todas las rutas con JWT
router.use(protect);

// ===== RUTAS DE ADMINISTRADOR =====
// Estadísticas del dashboard admin
router.get('/admin/stats', adminOnly, getAdminStats);

// Obtener todos los CDTs (con filtros)
router.get('/admin/all', adminOnly, validateCDTFilters, getAllCDTsForAdmin);

// Obtener CDTs pendientes de aprobación
router.get('/admin/pending', adminOnly, getPendingCDTs);

// Aprobar CDT (pending -> active)
router.post('/:id/approve', adminOnly, validateCDTId, approveCDT);

// Rechazar CDT (pending -> rejected)
router.post('/:id/reject', adminOnly, validateCDTId, rejectCDT);

// ===== RUTAS DE USUARIO =====
// Crear CDT (estado: draft)
router.post('/', validateCreateCDT, createCDT);

// Obtener mis CDTs
router.get('/my-cdts', validateCDTFilters, getMyCDTs);

// Enviar CDT a revisión (draft -> pending)
router.post('/:id/submit', validateCDTId, submitCDT);

// Cancelar CDT (pending/active -> cancelled)
router.post('/:id/cancel', validateCDTId, cancelCDTRequest);

// Obtener detalle de un CDT
router.get('/:id', validateCDTId, getCDTById);

// Actualizar CDT (solo si status = draft)
router.patch('/:id', validateCDTId, validateUpdateCDT, updateCDT);

// Cambiar estado de CDT (legacy - considerar deprecar)
router.patch('/:id/status', validateCDTId, validateChangeStatus, changeStatus);

// Cancelar CDT (legacy - usar POST /cancel en su lugar)
router.patch('/:id/cancel', validateCDTId, validateCancelCDT, cancelCDT);

// Obtener log de auditoría
router.get('/:id/audit', validateCDTId, getAuditLog);

// Eliminar CDT (solo admin o propietario si status = draft/rejected/cancelled)
router.delete('/:id', validateCDTId, deleteCDT);

// Rutas de administrador antiguas (mantener por compatibilidad)
router.get('/', restrictTo('admin'), validateCDTFilters, getAllCDTs);

export default router;
