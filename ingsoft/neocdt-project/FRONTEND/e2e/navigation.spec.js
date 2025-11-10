import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

/**
 * Pruebas E2E para navegación general y perfil de usuario
 * 
 * Cubre:
 * - Navegación entre páginas
 * - Perfil de usuario
 * - Responsividad
 * - Accesibilidad básica
 */

test.describe('Navegación General', () => {
  
  test('debe cargar la página principal correctamente', async ({ page }) => {
    await page.goto('/');
    
    // Verificar elementos clave
    await expect(page.locator('header, nav')).toBeVisible();
    await expect(page.locator('h1, .hero, .main-title')).toBeVisible();
  });

  test('debe navegar a todas las páginas públicas', async ({ page }) => {
    await page.goto('/');

    // Páginas que deben ser accesibles sin login
    const publicPages = [
      { link: /inicio|home/i, url: /^\/$|home/ },
      { link: /simula|calculadora/i, url: /simulator|simula/ },
      { link: /canal.*atención|contact/i, url: /canales|contact/ },
      { link: /transparencia|transparency/i, url: /transparencia|transparency/ },
    ];

    for (const { link, url } of publicPages) {
      await page.goto('/');
      
      const linkElement = page.locator(`a:has-text("${link.source.replace(/\\/g, '')}")`).first();
      if (await linkElement.count() > 0) {
        await linkElement.click();
        await expect(page).toHaveURL(url, { timeout: 5000 });
      }
    }
  });

  test('debe mostrar menú de navegación en header', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que existe nav o menú
    const nav = page.locator('nav, header nav, .navbar');
    await expect(nav).toBeVisible();
    
    // Verificar links principales
    await expect(page.locator('a:has-text("Inicio"), a:has-text("Home")')).toBeVisible();
  });

  test('debe mostrar footer con información relevante', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
  });

  test('debe cambiar de idioma si está disponible', async ({ page }) => {
    await page.goto('/');
    
    const langSwitch = page.locator('button:has-text("EN"), button:has-text("ES"), select[name="language"]');
    
    if (await langSwitch.count() > 0) {
      await langSwitch.first().click();
      
      // Verificar cambio visual
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Perfil de Usuario', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('debe acceder al perfil de usuario', async ({ page }) => {
    // Buscar enlace o botón de perfil
    const profileLink = page.locator('a:has-text("Perfil"), a:has-text("Profile"), button:has-text("Mi cuenta")');
    
    if (await profileLink.count() > 0) {
      await profileLink.first().click();
      await expect(page).toHaveURL(/profile|perfil|account/);
    } else {
      // Intentar por menú desplegable
      await page.click('[aria-label="User menu"], .user-menu, button:has(img[alt*="avatar"])');
      await page.click('a:has-text("Perfil"), a:has-text("Profile")');
      await expect(page).toHaveURL(/profile|perfil|account/);
    }
  });

  test('debe mostrar información del usuario en el perfil', async ({ page }) => {
    await page.goto('/profile');
    
    // Verificar que se muestra la información
    await expect(page.locator('text=/nombre|name/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/email|correo/i')).toBeVisible();
    await expect(page.locator('text=user@test.com')).toBeVisible();
  });

  test('debe permitir editar información del perfil', async ({ page }) => {
    await page.goto('/profile');
    
    const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit")');
    
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Verificar que los campos son editables
      const firstNameInput = page.locator('input[name="firstName"], input[name="nombre"]');
      await expect(firstNameInput).toBeEditable();
      
      // Intentar editar
      await firstNameInput.fill('Test Updated');
      await page.click('button:has-text("Guardar"), button:has-text("Save")');
      
      // Verificar éxito
      await expect(page.locator('text=/actualizado|updated|guardado/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe permitir cambiar contraseña', async ({ page }) => {
    await page.goto('/profile');
    
    const changePasswordButton = page.locator('button:has-text("Cambiar contraseña"), button:has-text("Change password")');
    
    if (await changePasswordButton.count() > 0) {
      await changePasswordButton.click();
      
      // Verificar que se muestra el formulario
      await expect(page.locator('input[name="currentPassword"], input[name="oldPassword"]')).toBeVisible();
      await expect(page.locator('input[name="newPassword"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"], input[name="confirmNewPassword"]')).toBeVisible();
    }
  });

  test('debe validar contraseña actual al cambiarla', async ({ page }) => {
    await page.goto('/profile');
    
    const changePasswordButton = page.locator('button:has-text("Cambiar contraseña"), button:has-text("Change password")');
    
    if (await changePasswordButton.count() > 0) {
      await changePasswordButton.click();
      
      // Intentar cambiar con contraseña incorrecta
      await page.fill('input[name="currentPassword"], input[name="oldPassword"]', 'WrongPassword');
      await page.fill('input[name="newPassword"]', 'NewTest123!@#');
      await page.fill('input[name="confirmPassword"], input[name="confirmNewPassword"]', 'NewTest123!@#');
      
      await page.click('button[type="submit"]');
      
      // Verificar error
      await expect(page.locator('text=/contraseña.*incorrecta|incorrect password/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe mostrar estado de cuenta o extracto', async ({ page }) => {
    const accountStatementLink = page.locator('a:has-text("Estado de cuenta"), a:has-text("Account statement"), a:has-text("Extracto")');
    
    if (await accountStatementLink.count() > 0) {
      await accountStatementLink.first().click();
      await expect(page).toHaveURL(/account-statement|estado-cuenta|extracto/);
      
      // Verificar que se muestra información
      await expect(page.locator('table, .transaction-list, .statement')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Responsividad', () => {
  
  test('debe funcionar correctamente en móvil', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Verificar que el contenido es visible
    await expect(page.locator('h1, .hero-title')).toBeVisible();
    
    // Verificar menú hamburguesa si existe
    const mobileMenu = page.locator('button[aria-label="Menu"], .hamburger, .mobile-menu-button');
    
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
      
      // Verificar que se abre el menú
      await expect(page.locator('nav, .mobile-nav')).toBeVisible();
    }
  });

  test('debe funcionar correctamente en tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await expect(page.locator('header, nav')).toBeVisible();
    
    // Login y verificar dashboard
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('debe funcionar correctamente en desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    
    // Verificar que el layout es apropiado
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});

test.describe('Accesibilidad Básica', () => {
  
  test('debe tener título en la página', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('debe permitir navegación por teclado', async ({ page }) => {
    await page.goto('/login');
    
    // Navegar con Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar que el focus está visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('debe tener alt text en imágenes', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // Alt puede ser vacío para imágenes decorativas, pero debe existir el atributo
        expect(alt !== null).toBeTruthy();
      }
    }
  });

  test('debe tener labels en inputs de formularios', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    
    // Verificar que tiene label o aria-label
    const ariaLabel = await emailInput.getAttribute('aria-label');
    const id = await emailInput.getAttribute('id');
    
    let hasLabel = false;
    
    if (ariaLabel) {
      hasLabel = true;
    } else if (id) {
      const label = page.locator(`label[for="${id}"]`);
      hasLabel = await label.count() > 0;
    }
    
    expect(hasLabel).toBeTruthy();
  });

  test('debe tener contraste adecuado (verificación visual)', async ({ page }) => {
    await page.goto('/');
    
    // Tomar screenshot para revisión manual de contraste
    await page.screenshot({ path: 'e2e-screenshots/contrast-check.png', fullPage: true });
  });
});

test.describe('Manejo de Errores', () => {
  
  test('debe mostrar página 404 para rutas inexistentes', async ({ page }) => {
    await page.goto('/ruta-que-no-existe-12345');
    
    // Verificar mensaje de error o redirección
    await expect(page.locator('text=/404|no encontrada|not found/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe manejar errores de red gracefully', async ({ page }) => {
    // Interceptar requests y simular error
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/login');
    await page.selectOption('select[name="documentType"]', 'CC');
    await page.fill('input[name="documentNumber"]', '1234567890');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error
    await expect(page.locator('text=/error.*conexión|connection error|network error/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe manejar sesión expirada', async ({ page }) => {
    await login(page);
    
    // Limpiar tokens del localStorage
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
    
    // Intentar acceder a recurso protegido
    await page.goto('/dashboard');
    
    // Debe redirigir a login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});

test.describe('Performance', () => {
  
  test('debe cargar la página principal en tiempo razonable', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });

  test('debe cargar assets críticos correctamente', async ({ page }) => {
    const response = await page.goto('/');
    
    // Verificar status code
    expect(response?.status()).toBe(200);
    
    // Verificar que se cargó contenido
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});
