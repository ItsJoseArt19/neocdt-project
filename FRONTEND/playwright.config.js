import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para pruebas E2E del proyecto NeoCDT
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Mover las specs a una carpeta dedicada de pruebas
  testDir: './tests/e2e',
  
  /* Ejecutar tests en paralelo */
  // Permitir paralelismo para acelerar en local
  fullyParallel: true,
  
  /* Fallar el build si se dejan tests con .only */
  forbidOnly: false,
  
  /* Reintentos en CI */
  retries: 0,
  
  /* Trabajadores paralelos */
  // Más workers en local para velocidad; en CI se puede bajar
  workers: 2,
  
  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],
  
  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base para navegación */
    baseURL: 'http://localhost:5173',
    
    /* Captura de pantalla solo en fallo */
    screenshot: 'only-on-failure',
    
    /* Video solo en fallo */
    video: 'retain-on-failure',
    
    /* Traza en fallo */
    trace: 'on-first-retry',
  },

  /* Configurar proyectos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test en dispositivos móviles */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Servidor de desarrollo */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    // Reutilizar servidor si ya está levantado para evitar reinicios costosos
    reuseExistingServer: true,
    timeout: 120000,
  },
});
