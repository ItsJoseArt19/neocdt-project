import winston from 'winston';
import { config } from '../config/env.js';

/**
 * Logger configuration using Winston
 * Provides structured logging for the application
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'neocdt-backend' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: consoleFormat,
      silent: config.nodeEnv === 'test' // Silence logs in test environment
    })
  ]
});

// Add file transports in production
if (config.nodeEnv === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

/**
 * Helper function to log database operations
 * @param {string} operation - The database operation being performed
 * @param {Object} details - Additional details about the operation
 */
export const logDatabase = (operation, details = {}) => {
  logger.info(`Database: ${operation}`, details);
};

/**
 * Helper function to log authentication events
 * @param {string} event - The auth event
 * @param {Object} details - Additional details
 */
export const logAuth = (event, details = {}) => {
  logger.info(`Auth: ${event}`, details);
};

/**
 * Helper function to log API requests
 * @param {Object} req - Express request object
 */
export const logRequest = (req) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });
};

// Export logger as both named and default
export { logger };
export default logger;

