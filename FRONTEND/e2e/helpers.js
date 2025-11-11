/**
 * Funciones auxiliares para pruebas E2E
 */

/**
 * Realiza login con credenciales usando documento
 * @param {import('@playwright/test').Page} page 
 * @param {string} documentType - 'CC' o 'CE'
 * @param {string} documentNumber - Número de documento
 * @param {string} password 
 */
export async function login(page, documentType = 'CC', documentNumber = '1234567890', password = 'Test123!@#') {
  await page.goto('/login');
  await page.selectOption('select#documentType', documentType);
  await page.fill('input#documentNumber', documentNumber);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  
  // Esperar redirección al dashboard
  await page.waitForURL(/dashboard|\//, { timeout: 10000 });
}

/**
 * Llena el formulario de registro completo
 * @param {import('@playwright/test').Page} page 
 * @param {object} userData - Datos del usuario
 */
export async function fillRegisterForm(page, userData) {
  await page.selectOption('select#documentType', userData.documentType);
  await page.fill('input#documentNumber', userData.documentNumber);
  await page.fill('input#name', userData.name);
  await page.fill('input#email', userData.email);
  await page.fill('input#phone', userData.phone);
  await page.fill('input#password', userData.password);
  await page.fill('input#confirmPassword', userData.confirmPassword);
}

/**
 * Llena el formulario de login
 * @param {import('@playwright/test').Page} page 
 * @param {object} credentials - Credenciales {documentType, documentNumber, password}
 */
export async function fillLoginForm(page, credentials) {
  await page.selectOption('select#documentType', credentials.documentType);
  await page.fill('input#documentNumber', credentials.documentNumber);
  await page.fill('input#password', credentials.password);
}

/**
 * Realiza logout
 * @param {import('@playwright/test').Page} page 
 */
export async function logout(page) {
  // Buscar botón de logout
  const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Salir"), button:has-text("Cerrar Sesión")').first();
  
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForURL(/login|^\/$/, { timeout: 5000 });
  }
}

/**
 * Genera email único para tests
 * @returns {string}
 */
export function generateUniqueEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test${timestamp}${random}@example.com`;
}

/**
 * Genera número de documento único para tests
 * @returns {string} - Número de documento de 10 dígitos
 */
export function generateUniqueDocumentNumber() {
  const timestamp = Date.now();
  return `10${timestamp.toString().slice(-8)}`;
}

/**
 * Genera fecha futura
 * @param {number} daysAhead - Días en el futuro
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export function getFutureDate(daysAhead = 30) {
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);
  return future.toISOString().split('T')[0];
}

/**
 * Espera a que desaparezca el spinner/loader
 * @param {import('@playwright/test').Page} page 
 */
export async function waitForLoader(page) {
  const loader = page.locator('.loader, .spinner, [role="progressbar"]');
  
  if (await loader.count() > 0) {
    await loader.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

/**
 * Limpia el localStorage
 * @param {import('@playwright/test').Page} page 
 */
export async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Verifica si un elemento es visible con timeout personalizado
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 * @param {number} timeout 
 * @returns {Promise<boolean>}
 */
export async function isVisibleWithTimeout(page, selector, timeout = 3000) {
  try {
    await page.locator(selector).waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Toma screenshot con nombre descriptivo
 * @param {import('@playwright/test').Page} page 
 * @param {string} name 
 */
export async function takeScreenshot(page, name) {
  const timestamp = Date.now();
  await page.screenshot({ 
    path: `e2e-screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Crea un CDT de prueba
 * @param {import('@playwright/test').Page} page 
 * @param {object} options 
 */
export async function createTestCDT(page, options = {}) {
  const {
    amount = '10000000',
    termMonths = '12',
    daysAhead = 30
  } = options;

  // Navegar a creación de CDT
  await page.click('button:has-text("Crear CDT"), a:has-text("Nuevo CDT")');
  
  // Llenar formulario
  await page.fill('input[name="amount"]', amount);
  
  const termInput = page.locator('select[name="termMonths"], input[name="termMonths"]').first();
  if (await termInput.evaluate(el => el.tagName === 'SELECT')) {
    await termInput.selectOption(termMonths);
  } else {
    await termInput.fill(termMonths);
  }

  await page.fill('input[name="startDate"], input[type="date"]', getFutureDate(daysAhead));
  
  // Enviar
  await page.click('button[type="submit"]:has-text("Crear"), button:has-text("Confirmar")');
  
  // Esperar confirmación
  await page.waitForSelector('text=/cdt.*creado|éxito|success/i', { timeout: 5000 });
}

/**
 * Espera por peticiones de red
 * @param {import('@playwright/test').Page} page 
 * @param {string} urlPattern 
 */
export async function waitForApiCall(page, urlPattern) {
  return page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Verifica que un toast/notification aparezca
 * @param {import('@playwright/test').Page} page 
 * @param {string} messagePattern 
 */
export async function expectToast(page, messagePattern) {
  const toast = page.locator('.toast, .notification, .alert, [role="alert"]');
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  
  const text = await toast.textContent();
  return text?.match(new RegExp(messagePattern, 'i'));
}
