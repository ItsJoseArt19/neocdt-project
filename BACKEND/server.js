import app from './src/app.js';
import { config } from './src/config/env.js';
import { connectDB, closeDB, createBackup } from './src/config/database.js';

const PORT = config.port || 5000;

// Función principal async para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos SQLite (ahora async)
    await connectDB();

    // Crear backup cada 24 horas en producción
    if (config.nodeEnv === 'production') {
      setInterval(() => {
        createBackup();
      }, 24 * 60 * 60 * 1000); // 24 horas
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api/${config.apiVersion}`);
      console.log(`💾 Database: SQLite`);
      console.log(`\n📝 API Endpoints:`);
      console.log(`   - POST /api/${config.apiVersion}/auth/register`);
      console.log(`   - POST /api/${config.apiVersion}/auth/login`);
      console.log(`   - POST /api/${config.apiVersion}/auth/refresh`);
      console.log(`   - POST /api/${config.apiVersion}/auth/logout`);
      console.log(`   - GET  /api/${config.apiVersion}/auth/profile`);
      console.log(`   - GET  /api/${config.apiVersion}/users/me`);
      console.log(`   - PATCH /api/${config.apiVersion}/users/me`);
      console.log(`   - PATCH /api/${config.apiVersion}/users/change-password`);
      console.log(`   - GET  /api/${config.apiVersion}/users (admin)`);
      console.log(`\n✅ Server ready to accept connections\n`);
    });

    // Manejo graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        closeDB();
        console.log('👋 Process terminated gracefully');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('unhandledRejection', (err) => {
      console.error('❌ UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      gracefulShutdown('UNHANDLED REJECTION');
    });

    process.on('uncaughtException', (err) => {
      console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
      console.error(err.name, err.message);
      gracefulShutdown('UNCAUGHT EXCEPTION');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

