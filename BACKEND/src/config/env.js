import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde archivo .env
dotenv.config();

// Determinar entorno
const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * Configuración centralizada de la aplicación
 * Todas las variables de entorno con valores por defecto seguros
 * IMPORTANTE: En producción, usar variables de entorno reales
 * Los valores por defecto son solo para desarrollo local
 */
export const config = {
  // Entorno de ejecución
  nodeEnv,
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database SQLite - Ruta a archivo de base de datos
  // En tests, usar :memory: o una BD separada
  dbPath: nodeEnv === 'test' 
    ? process.env.DB_PATH || ':memory:'
    : process.env.DB_PATH || join(__dirname, '../database/neocdt.db'),
  dbBackupPath: process.env.DB_BACKUP_PATH || join(__dirname, '../database/backups'),
  
  // JWT - Secrets deben cambiarse en producción
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // CORS - Orígenes permitidos para requests cross-origin
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  
  // Rate Limiting - Protección contra abuso
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10), // minutos
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // requests por ventana
  
  // Pagination - Límites de resultados por página
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  
  // Logging - Nivel de verbosidad de logs
  logLevel: process.env.LOG_LEVEL || 'info' // error, warn, info, debug
};
