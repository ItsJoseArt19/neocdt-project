import { connectDB, closeDB } from '../../config/database.js';
import User from '../../models/userModel.js';
import { logger } from '../../utils/logger.js';

const seedUsers = async () => {
  try {
    logger.info('🌱 Iniciando el sembrado de la base de datos...');

    // Crear usuario admin
    const adminExists = await User.findByEmail('admin@neocdt.com');
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@neocdt.com',
        password: 'Admin123!',
        role: 'admin'
      });
      logger.info('✅ Usuario administrador creado', { 
        email: 'admin@neocdt.com',
        note: 'Contraseña: Admin123!'
      });
    } else {
      logger.info('ℹ️  El usuario administrador ya existe');
    }

    // Crear usuario de prueba
    const testUserExists = await User.findByEmail('test@neocdt.com');
    if (!testUserExists) {
      await User.create({
        name: 'Test User',
        email: 'test@neocdt.com',
        password: 'Test123!',
        role: 'user'
      });
      logger.info('✅ Usuario de prueba creado', {
        email: 'test@neocdt.com',
        note: 'Contraseña: Test123!'
      });
    } else {
      logger.info('ℹ️  El usuario de prueba ya existe');
    }

    logger.info('✅ Sembrado completado exitosamente');
  } catch (error) {
    logger.error('❌ Falló el sembrado', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Ejecutar seeds (ahora con async/await)
(async () => {
  await connectDB();
  await seedUsers();
  closeDB();
})();
process.exit(0);