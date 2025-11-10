import { test, expect } from '@playwright/test';

/**
 * Pruebas E2E para el flujo de autenticación del sistema NeoCDT
 * 
 * Cubre:
 * - Registro de usuario
 * - Inicio de sesión
 * - Cierre de sesión
 * - Validaciones de formularios
 */

test.describe('Autenticación - Registro de Usuario', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de registro
    await page.goto('/register');
  });

  test('debe mostrar el formulario de registro correctamente', async ({ page }) => {
    // Verificar que los elementos del formulario estén presentes
    await expect(page.locator('select#documentType')).toBeVisible();
    await expect(page.locator('input#documentNumber')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe registrar un usuario exitosamente con datos válidos', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const docNumber = `10${timestamp.toString().slice(-8)}`; // 10 dígitos

    // Llenar el formulario
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', docNumber);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '31234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');

    // Enviar formulario
    await page.click('button[type="submit"]');

    // Esperar redirección o mensaje de éxito
    await expect(page).toHaveURL(/login|dashboard/, { timeout: 10000 });
  });

  test('debe mostrar error con email duplicado', async ({ page }) => {
    const timestamp = Date.now();
    const docNumber = `10${timestamp.toString().slice(-8)}`;

    // Usar un email que ya existe (del seed)
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', docNumber);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="phone"]', '31234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/email.*existe|ya.*registrado|already exists/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe validar formato de email', async ({ page }) => {
    const timestamp = Date.now();
    const docNumber = `10${timestamp.toString().slice(-8)}`;

    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', docNumber);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', '31234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    
    await page.click('button[type="submit"]');

    // Verificar mensaje de error o validación
    await expect(page.locator('text=/email.*válido|formato.*email|invalid.*email/i')).toBeVisible({ timeout: 3000 });
  });

  test('debe validar que las contraseñas coincidan', async ({ page }) => {
    const timestamp = Date.now();
    const docNumber = `10${timestamp.toString().slice(-8)}`;

    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', docNumber);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="phone"]', '31234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Different123!@#');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/contraseñas.*coinciden|no coinciden|passwords.*match/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe validar longitud mínima de contraseña', async ({ page }) => {
    const timestamp = Date.now();
    const docNumber = `10${timestamp.toString().slice(-8)}`;

    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', docNumber);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="phone"]', '31234567890');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/contraseña.*8.*caracteres|password.*8.*characters|mínimo.*8/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Autenticación - Inicio de Sesión', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('debe mostrar el formulario de login correctamente', async ({ page }) => {
    await expect(page.locator('select#documentType')).toBeVisible();
    await expect(page.locator('input#documentNumber')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe iniciar sesión con credenciales válidas', async ({ page }) => {
    // Usar credenciales del seed - debe existir un usuario con estos datos
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', '1234567890');
    await page.fill('input[name="password"]', 'Test123!@#');

    await page.click('button[type="submit"]');

    // Esperar redirección al dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('debe rechazar credenciales inválidas', async ({ page }) => {
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', '1234567890');
    await page.fill('input[name="password"]', 'WrongPassword123');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/credenciales.*incorrectas|invalid credentials|contraseña.*incorrecta/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe rechazar usuario inexistente', async ({ page }) => {
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', '9999999999');
    await page.fill('input[name="password"]', 'Test123!@#');

    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    await expect(page.locator('text=/usuario.*encontrado|user.*not found|credenciales|no.*existe/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Verificar validación - el documentNumber debe ser requerido
    await expect(page.locator('text=/documento.*requerido|campo.*obligatorio|required/i')).toBeVisible({ timeout: 3000 });
  });

  test('debe redirigir a registro desde link', async ({ page }) => {
    await page.click('text=/registr|sign up|crear.*cuenta/i');
    await expect(page).toHaveURL(/register/);
  });
});

test.describe('Autenticación - Sesión y Navegación', () => {
  
  test('debe mantener sesión después de login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', '1234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Recargar página
    await page.reload();

    // Verificar que sigue en dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('debe cerrar sesión correctamente', async ({ page }) => {
    // Login primero
    await page.goto('/login');
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', '1234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Buscar y hacer clic en logout
    await page.click('button:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Salir"), button:has-text("Cerrar Sesión")');

    // Verificar redirección a login o home
    await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 });

    // Verificar que no se puede acceder al dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('debe redirigir a login si no está autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});

test.describe('Autenticación - Flujo Completo', () => {
  
  test('debe completar flujo: registro → login → dashboard → logout', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e${timestamp}@example.com`;
    const docNumber = `10${timestamp.toString().slice(-8)}`;

    // 1. Registro
    await page.goto('/register');
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', docNumber);
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '31234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="confirmPassword"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    // 2. Login (puede redirigir automáticamente o requerir login manual)
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      await page.selectOption('select[name="documentType"]', 'CC');
      await page.fill('input[name="documentNumber"]', docNumber);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]');
    }

    // 3. Verificar dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // 4. Logout
    await page.click('button:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Salir"), button:has-text("Cerrar Sesión")');
    await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 });
  });
});
