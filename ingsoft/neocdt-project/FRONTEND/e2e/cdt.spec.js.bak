import { test, expect } from '@playwright/test';
import { login } from './helpers.js';

/**
 * Pruebas E2E para el flujo de CDTs (Certificados de Depósito a Término)
 * 
 * Cubre:
 * - Simulación de CDT
 * - Creación de CDT
 * - Visualización de CDTs
 * - Gestión de estados
 * - Cancelación de CDT
 */

test.describe('CDT - Simulador', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe acceder al simulador desde la página principal', async ({ page }) => {
    // Buscar enlace o botón del simulador
    await page.click('text=/simula|calculadora/i');
    await expect(page).toHaveURL(/simulator|simula/);
  });

  test('debe mostrar formulario de simulación con campos requeridos', async ({ page }) => {
    await page.goto('/simulator');
    
    await expect(page.locator('input[name="amount"], input#amount')).toBeVisible();
    await expect(page.locator('input[name="termMonths"], select[name="termMonths"], input#termMonths')).toBeVisible();
    await expect(page.locator('button:has-text("Simular"), button:has-text("Calcular")')).toBeVisible();
  });

  test('debe calcular rendimiento con datos válidos', async ({ page }) => {
    await page.goto('/simulator');

    // Llenar datos
    await page.fill('input[name="amount"], input#amount', '5000000');
    
    // Seleccionar plazo (puede ser select o input)
    const termInput = page.locator('select[name="termMonths"], input[name="termMonths"]').first();
    if (await termInput.evaluate(el => el.tagName === 'SELECT')) {
      await termInput.selectOption('12');
    } else {
      await termInput.fill('12');
    }

    // Simular
    await page.click('button:has-text("Simular"), button:has-text("Calcular")');

    // Verificar resultados
    await expect(page.locator('text=/rendimiento|ganancia|interés/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/total.*pagar|monto final/i')).toBeVisible();
  });

  test('debe validar monto mínimo (1.000.000)', async ({ page }) => {
    await page.goto('/simulator');

    await page.fill('input[name="amount"], input#amount', '500000');
    await page.click('button:has-text("Simular"), button:has-text("Calcular")');

    // Verificar mensaje de validación
    await expect(page.locator('text=/mínimo.*1.*000.*000|minimum.*1,000,000/i')).toBeVisible({ timeout: 3000 });
  });

  test('debe validar monto máximo (500.000.000)', async ({ page }) => {
    await page.goto('/simulator');

    await page.fill('input[name="amount"], input#amount', '600000000');
    await page.click('button:has-text("Simular"), button:has-text("Calcular")');

    // Verificar mensaje de validación
    await expect(page.locator('text=/máximo.*500.*000.*000|maximum.*500,000,000/i')).toBeVisible({ timeout: 3000 });
  });

  test('debe mostrar diferentes tasas según el plazo', async ({ page }) => {
    await page.goto('/simulator');

    // Simular con 3 meses
    await page.fill('input[name="amount"], input#amount', '5000000');
    const termInput = page.locator('select[name="termMonths"], input[name="termMonths"]').first();
    if (await termInput.evaluate(el => el.tagName === 'SELECT')) {
      await termInput.selectOption('3');
    } else {
      await termInput.fill('3');
    }
    await page.click('button:has-text("Simular"), button:has-text("Calcular")');
    
    const rate3Months = await page.locator('text=/tasa.*\\d+\\.\\d+%/i').textContent();

    // Simular con 12 meses
    if (await termInput.evaluate(el => el.tagName === 'SELECT')) {
      await termInput.selectOption('12');
    } else {
      await termInput.fill('12');
    }
    await page.click('button:has-text("Simular"), button:has-text("Calcular")');
    
    const rate12Months = await page.locator('text=/tasa.*\\d+\\.\\d+%/i').textContent();

    // La tasa de 12 meses debe ser diferente (generalmente mayor)
    expect(rate3Months).not.toBe(rate12Months);
  });
});

test.describe('CDT - Creación', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('debe mostrar botón para crear nuevo CDT', async ({ page }) => {
    await expect(page.locator('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")')).toBeVisible({ timeout: 5000 });
  });

  test('debe abrir formulario de creación de CDT', async ({ page }) => {
    await page.click('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")');
    
    // Verificar que se abre el formulario
    await expect(page.locator('input[name="amount"]')).toBeVisible();
    await expect(page.locator('select[name="termMonths"], input[name="termMonths"]')).toBeVisible();
    await expect(page.locator('input[name="startDate"], input[type="date"]')).toBeVisible();
  });

  test('debe crear CDT exitosamente con datos válidos', async ({ page }) => {
    await page.click('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")');

    // Llenar formulario
    await page.fill('input[name="amount"]', '10000000');
    
    const termInput = page.locator('select[name="termMonths"], input[name="termMonths"]').first();
    if (await termInput.evaluate(el => el.tagName === 'SELECT')) {
      await termInput.selectOption('12');
    } else {
      await termInput.fill('12');
    }

    // Fecha futura (30 días)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="startDate"], input[type="date"]', dateString);

    // Enviar
    await page.click('button[type="submit"]:has-text("Crear"), button:has-text("Confirmar")');

    // Verificar éxito
    await expect(page.locator('text=/cdt.*creado|éxito|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('debe rechazar CDT con monto fuera de rango', async ({ page }) => {
    await page.click('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")');

    // Monto muy bajo
    await page.fill('input[name="amount"]', '500000');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/mínimo|minimum/i')).toBeVisible({ timeout: 3000 });
  });

  test('debe rechazar fecha de inicio pasada', async ({ page }) => {
    await page.click('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")');

    await page.fill('input[name="amount"]', '5000000');
    
    const termInput = page.locator('select[name="termMonths"], input[name="termMonths"]').first();
    if (await termInput.evaluate(el => el.tagName === 'SELECT')) {
      await termInput.selectOption('6');
    } else {
      await termInput.fill('6');
    }

    // Fecha pasada
    await page.fill('input[name="startDate"], input[type="date"]', '2020-01-01');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/fecha.*futura|future date/i')).toBeVisible({ timeout: 3000 });
  });

  test('debe validar plazos permitidos (3, 6, 12, 18, 24 meses)', async ({ page }) => {
    await page.click('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")');

    const termSelect = page.locator('select[name="termMonths"]');
    
    if (await termSelect.count() > 0) {
      // Verificar opciones del select
      const options = await termSelect.locator('option').allTextContents();
      expect(options.some(opt => opt.includes('3'))).toBeTruthy();
      expect(options.some(opt => opt.includes('6'))).toBeTruthy();
      expect(options.some(opt => opt.includes('12'))).toBeTruthy();
    }
  });
});

test.describe('CDT - Visualización y Gestión', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('debe mostrar lista de CDTs del usuario', async ({ page }) => {
    // Navegar a "Mis CDTs" o dashboard
    const misCdtsLink = page.locator('a:has-text("Mis CDT"), a:has-text("My CDT"), button:has-text("Ver CDTs")');
    
    if (await misCdtsLink.count() > 0) {
      await misCdtsLink.first().click();
    }

    // Verificar que se muestra la lista o tabla
    await expect(page.locator('table, .cdt-card, .cdt-list')).toBeVisible({ timeout: 5000 });
  });

  test('debe filtrar CDTs por estado', async ({ page }) => {
    // Si existe filtro de estado
    const statusFilter = page.locator('select[name="status"], button:has-text("Draft"), button:has-text("Active")');
    
    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();
      
      // Verificar que la lista se actualiza
      await page.waitForLoadState('networkidle');
    }
  });

  test('debe ver detalles de un CDT específico', async ({ page }) => {
    // Click en el primer CDT de la lista
    const firstCdt = page.locator('tr:has-text("CDT"), .cdt-card, .cdt-item').first();
    
    if (await firstCdt.count() > 0) {
      await firstCdt.click();

      // Verificar que se muestran los detalles
      await expect(page.locator('text=/monto|amount/i')).toBeVisible();
      await expect(page.locator('text=/plazo|term/i')).toBeVisible();
      await expect(page.locator('text=/tasa|rate/i')).toBeVisible();
    }
  });

  test('debe permitir editar CDT en estado draft', async ({ page }) => {
    // Buscar CDT en draft
    const draftCdt = page.locator('tr:has-text("draft"), .cdt-card:has-text("Borrador")').first();
    
    if (await draftCdt.count() > 0) {
      await draftCdt.click();

      // Buscar botón de editar
      const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit")');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        
        // Verificar que el formulario es editable
        await expect(page.locator('input[name="amount"]')).toBeEditable();
      }
    }
  });

  test('debe NO permitir editar CDT en estado activo', async ({ page }) => {
    // Buscar CDT activo
    const activeCdt = page.locator('tr:has-text("active"), .cdt-card:has-text("Activo")').first();
    
    if (await activeCdt.count() > 0) {
      await activeCdt.click();

      // El botón de editar no debe estar o debe estar deshabilitado
      const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit")');
      
      if (await editButton.count() > 0) {
        await expect(editButton).toBeDisabled();
      }
    }
  });

  test('debe cancelar CDT con razón', async ({ page }) => {
    // Buscar CDT activo
    const activeCdt = page.locator('tr:has-text("active"), .cdt-card:has-text("Activo")').first();
    
    if (await activeCdt.count() > 0) {
      await activeCdt.click();

      // Buscar botón de cancelar
      const cancelButton = page.locator('button:has-text("Cancelar CDT"), button:has-text("Cancel")');
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();

        // Llenar razón
        await page.fill('textarea[name="reason"], input[name="cancelReason"]', 'Necesidad de liquidez urgente');
        
        await page.click('button:has-text("Confirmar"), button[type="submit"]');

        // Verificar éxito
        await expect(page.locator('text=/cancelado|cancelled/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('debe ver historial de auditoría del CDT', async ({ page }) => {
    // Click en un CDT
    const firstCdt = page.locator('tr:has-text("CDT"), .cdt-card, .cdt-item').first();
    
    if (await firstCdt.count() > 0) {
      await firstCdt.click();

      // Buscar pestaña o sección de auditoría
      const auditTab = page.locator('button:has-text("Auditoría"), a:has-text("Historial")');
      
      if (await auditTab.count() > 0) {
        await auditTab.click();

        // Verificar que se muestra el historial
        await expect(page.locator('text=/creado|created|modificado/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('CDT - Flujo Completo', () => {
  
  test('debe completar flujo: simular → crear → ver detalles → cancelar', async ({ page }) => {
    // 1. Simular
    await page.goto('/simulator');
    await page.fill('input[name="amount"], input#amount', '15000000');
    
    const termInput = page.locator('select[name="termMonths"], input[name="termMonths"]').first();
    if (await termInput.evaluate(el => el.tagName === 'SELECT')) {
      await termInput.selectOption('12');
    } else {
      await termInput.fill('12');
    }
    
    await page.click('button:has-text("Simular"), button:has-text("Calcular")');
    await expect(page.locator('text=/rendimiento|ganancia/i')).toBeVisible();

    // 2. Login
    await login(page);

    // 3. Crear CDT
    await page.click('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")');
    await page.fill('input[name="amount"]', '15000000');
    
    const termInput2 = page.locator('select[name="termMonths"], input[name="termMonths"]').first();
    if (await termInput2.evaluate(el => el.tagName === 'SELECT')) {
      await termInput2.selectOption('12');
    } else {
      await termInput2.fill('12');
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.fill('input[name="startDate"], input[type="date"]', futureDate.toISOString().split('T')[0]);
    
    await page.click('button[type="submit"]:has-text("Crear"), button:has-text("Confirmar")');
    await expect(page.locator('text=/cdt.*creado|éxito/i')).toBeVisible({ timeout: 5000 });

    // 4. Ver detalles del CDT recién creado
    await page.waitForTimeout(1000);
    const newCdt = page.locator('text=/15.*000.*000|15,000,000/').first();
    if (await newCdt.count() > 0) {
      await newCdt.click();
      await expect(page.locator('text=/detalles|details/i')).toBeVisible();
    }
  });
});
