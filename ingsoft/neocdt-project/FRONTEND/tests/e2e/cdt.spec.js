import { test, expect } from "@playwright/test";
import { loginUser, simulateCDT, createCDT } from "./support/helpers.js";

// Simulador CDT

test.describe("CDT - Simulador", () => {
  test("debe mostrar formulario de simulación con campos requeridos", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.locator("input[name='amount'], input#amount")).toBeVisible();
    await expect(page.locator("input[name='termMonths'], select[name='termMonths'], input#termMonths" )).toBeVisible();
    await expect(page.getByRole("button", { name: /simular|calcular/i })).toBeVisible();
  });

  test("debe calcular rendimiento con datos válidos", async ({ page }) => {
    await simulateCDT(page, { amount: 5000000, termMonths: 12 });
  });

  test("debe validar monto mínimo (1.000.000)", async ({ page }) => {
    await page.goto("/simulator");
    const amountInput = page.locator("input[name='amount'], input#amount").first();
    await amountInput.fill("500000");
    await page.getByRole("button", { name: /simular|calcular/i }).click();
    await expect(page.locator('text=/mínimo.*1.*000.*000|minimum.*1,000,000/i')).toBeVisible({ timeout: 3000 });
  });

  test("debe validar monto máximo (500.000.000)", async ({ page }) => {
    await page.goto("/simulator");
    const amountInput = page.locator("input[name='amount'], input#amount").first();
    await amountInput.fill("600000000");
    await page.getByRole("button", { name: /simular|calcular/i }).click();
    await expect(page.locator('text=/máximo.*500.*000.*000|maximum.*500,000,000/i')).toBeVisible({ timeout: 3000 });
  });

  test("debe simular múltiples escenarios rápidamente", async ({ page }) => {
    const scenarios = [
      { amount: 1000000, termMonths: 3 },
      { amount: 10000000, termMonths: 6 },
      { amount: 50000000, termMonths: 12 }
    ];
    for (const s of scenarios) {
      await simulateCDT(page, s);
    }
  });
});

// Creación de CDT autenticado

test.describe("CDT - Creación", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page); // usa usuario seed
  });

  test("debe mostrar botón para crear nuevo CDT", async ({ page }) => {
    await expect(page.getByRole("button", { name: /crear cdt|nuevo cdt/i })).toBeVisible({ timeout: 5000 });
  });

  test("debe crear CDT exitosamente con datos válidos", async ({ page }) => {
    const ok = await createCDT(page, { amount: 10000000, termMonths: 12 });
    expect(ok).toBeTruthy();
  });

  test("debe rechazar CDT con monto fuera de rango", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: /crear cdt|nuevo cdt/i });
    await createBtn.click();
    await page.fill("input[name='amount']", "500000");
    await page.getByRole("button", { name: /crear|confirmar/i }).click();
    await expect(page.locator('text=/mínimo|minimum/i')).toBeVisible({ timeout: 3000 });
  });

  test("debe rechazar fecha de inicio pasada", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: /crear cdt|nuevo cdt/i });
    await createBtn.click();
    await page.fill("input[name='amount']", "5000000");
    const termInput = page.locator("select[name='termMonths'], input[name='termMonths']").first();
    const tag = await termInput.evaluate(el => el.tagName);
    if (tag === "SELECT") {
      await termInput.selectOption("6");
    } else {
      await termInput.fill("6");
    }
    await page.fill("input[name='startDate'], input[type='date']", "2020-01-01");
    await page.getByRole("button", { name: /crear|confirmar/i }).click();
    await expect(page.locator('text=/fecha.*futura|future date/i')).toBeVisible({ timeout: 3000 });
  });
});

// Flujo completo CDT

test.describe("CDT - Flujo Completo", () => {
  test.slow();
  test("debe completar flujo: simular → login → crear CDT", async ({ page }) => {
    await simulateCDT(page, { amount: 15000000, termMonths: 12 });
    await loginUser(page);
    const created = await createCDT(page, { amount: 15000000, termMonths: 12 });
    expect(created).toBeTruthy();
  });
});
