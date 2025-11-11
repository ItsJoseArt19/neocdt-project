// Helpers reutilizables para pruebas E2E NeoCDT
// Usar solo APIs de Playwright sin esperas fijas.

import { expect } from "@playwright/test";

export function uniqueSuffix() {
  const t = Date.now().toString();
  return t.slice(-8) + Math.floor(Math.random() * 1000);
}

export function genDocumentNumber() {
  // CC 10 dígitos
  return "10" + uniqueSuffix().slice(0, 8); // garantiza longitud
}

export function genEmail(prefix = "test") {
  return `${prefix}${uniqueSuffix()}@example.com`;
}

export async function registerUser(page, {
  documentType = "CC",
  documentNumber = genDocumentNumber(),
  name = "Test User",
  email = genEmail(),
  phone = "3123456789",
  password = "Test123!@#"
} = {}) {
  await page.goto("/register");
  await page.selectOption("select#documentType", documentType);
  await page.fill("input#documentNumber", documentNumber);
  await page.fill("input#name", name);
  await page.fill("input#email", email);
  await page.fill("input#phone", phone);
  await page.fill("input#password", password);
  await page.fill("input#confirmPassword", password);
  await page.getByRole("button", { name: /registr|crear/i }).click();
  await expect(page).toHaveURL(/login|dashboard|\//, { timeout: 10000 });
  return { documentType, documentNumber, email, password, name };
}

export async function loginUser(page, {
  documentType = "CC",
  documentNumber = "1234567890",
  password = "Test123!@#"
} = {}) {
  await page.goto("/login");
  await page.selectOption("select#documentType", documentType);
  await page.fill("input#documentNumber", documentNumber);
  await page.fill("input#password", password);
  await page.getByRole("button", { name: /ingresar|login|entrar/i }).click();
  await expect(page).toHaveURL(/dashboard|\//, { timeout: 10000 });
}

export async function simulateCDT(page, { amount = 5000000, termMonths = 12 } = {}) {
  await page.goto("/simulator");
  const amountInput = page.locator("input[name='amount'], input#amount").first();
  await amountInput.fill(String(amount));
  const termInput = page.locator("select[name='termMonths'], input[name='termMonths'], select#termMonths, input#termMonths").first();
  const tag = await termInput.evaluate(el => el.tagName);
  if (tag === "SELECT") {
    await termInput.selectOption(String(termMonths));
  } else {
    await termInput.fill(String(termMonths));
  }
  await page.getByRole("button", { name: /simular|calcular/i }).click();
  await expect(page.locator('text=/rendimiento|ganancia|interés|total/i')).toBeVisible({ timeout: 5000 });
}

export async function createCDT(page, { amount = 10000000, termMonths = 12, daysAhead = 30 } = {}) {
  // Asume sesión iniciada
  const createBtn = page.getByRole("button", { name: /crear cdt|nuevo cdt/i });
  if (await createBtn.count() === 0) return false;
  await createBtn.click();
  await page.fill("input[name='amount']", String(amount));
  const termInput = page.locator("select[name='termMonths'], input[name='termMonths']").first();
  const tag = await termInput.evaluate(el => el.tagName);
  if (tag === "SELECT") {
    await termInput.selectOption(String(termMonths));
  } else {
    await termInput.fill(String(termMonths));
  }
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  await page.fill("input[name='startDate'], input[type='date']", futureDate.toISOString().split("T")[0]);
  await page.getByRole("button", { name: /crear|confirmar/i }).click();
  await expect(page.locator('text=/cdt.*creado|éxito|success/i')).toBeVisible({ timeout: 5000 });
  return true;
}

export async function logoutUser(page) {
  const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), a:has-text("Salir"), button:has-text("Cerrar Sesión")').first();
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    // Redirección esperada a login o home
    await expect(page).toHaveURL(/login|\//, { timeout: 5000 });
  }
}
