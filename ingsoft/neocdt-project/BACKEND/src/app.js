import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { config } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { csrfProtection } from './middlewares/csrfProtection.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cdtRoutes from './routes/cdtRoutes.js';
import cacheRoutes from './routes/cacheRoutes.js';

const app = express();

// Seguridad - Helmet.js con configuración robusta
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Permitir scripts inline para desarrollo
      styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos inline
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 año en segundos
    includeSubDomains: true,
    preload: true
  },
  // X-Frame-Options
  frameguard: {
    action: 'deny' // Prevenir clickjacking
  },
  // X-Content-Type-Options
  noSniff: true,
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false
  },
  // X-Download-Options
  ieNoOpen: true,
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
}));

// CORS
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

// Rate Limiting Global - 100 requests por 15 minutos
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de requests por IP
  message: {
    status: 'fail',
    message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.'
  },
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Demasiadas solicitudes. Por favor, intente nuevamente en 15 minutos.'
    });
  }
});
app.use('/api', globalLimiter);

// Body Parser
app.use(express.json({ limit: '10kb' })); // Limitar tamaño de body a 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization contra NoSQL Injection
app.use(mongoSanitize()); // Remueve $ y . de req.body, req.params, req.query

// Prevenir HTTP Parameter Pollution
app.use(hpp({
  whitelist: [
    'status', 'role', 'page', 'limit', 'sort', // Permitir parámetros duplicados necesarios
    'isActive', 'userId', 'termMonths', 'amount', 'interestRate'
  ]
}));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health Check con métricas del sistema
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    data: {
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`, // Resident Set Size
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv
    }
  });
});

// CSRF Token endpoint (public, no protection needed)
app.get(`/api/${config.apiVersion}/csrf-token`, csrfProtection, (req, res) => {
  res.status(200).json({
    status: 'success',
    csrfToken: req.csrfToken()
  });
});

// API Routes
const apiVersion = config.apiVersion;
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/cdts`, cdtRoutes);
app.use(`/api/${apiVersion}/cache`, cacheRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to NEOCDT API',
    version: apiVersion,
    endpoints: {
      health: '/health',
      auth: `/api/${apiVersion}/auth`,
      users: `/api/${apiVersion}/users`,
      cdts: `/api/${apiVersion}/cdts`,
      cache: `/api/${apiVersion}/cache`
    }
  });
});

// 404 Handler
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Error Handler
app.use(errorHandler);

export default app;
