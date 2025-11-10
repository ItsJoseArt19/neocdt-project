import { test, expect } from "@playwright/test";
import { registerUser, loginUser, genDocumentNumber, genEmail, logoutUser } from "./support/helpers.js";

// Suite: Autenticación

test.describe("Autenticación - Registro de Usuario", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("debe mostrar el formulario de registro correctamente", async ({ page }) => {
    await expect(page.locator("select#documentType")).toBeVisible();
    await expect(page.locator("input#documentNumber")).toBeVisible();
    await expect(page.locator("input#name")).toBeVisible();
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#phone")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#confirmPassword")).toBeVisible();
    await expect(page.getByRole("button", { name: /registr|crear cuenta|crear/i })).toBeVisible();
  });

  test.slow();
  test("debe registrar un usuario exitosamente con datos válidos", async ({ page }) => {
    await registerUser(page, {
      documentType: "CC",
      documentNumber: genDocumentNumber(),
      name: "Test User Automation",
      email: genEmail(),
      phone: "3123456789",
      password: "Test123!@#",
    });
    // Redirección verificada en helper
  });

  test("debe validar formato de email", async ({ page }) => {
    await page.selectOption("select#documentType", "CC");
    await page.fill("input#documentNumber", genDocumentNumber());
    await page.fill("input#name", "Test User");
    await page.fill("input#email", "invalid-email");
    await page.fill("input#phone", "3123456789");
    await page.fill("input#password", "Test123!@#");
    await page.fill("input#confirmPassword", "Test123!@#");
    await page.getByRole("button", { name: /registr|crear/i }).click();
    await expect(page.locator(".field-error, .login-error, [role='alert']").first()).toBeVisible({ timeout: 3000 });
  });

  test("debe validar que las contraseñas coincidan", async ({ page }) => {
    await page.selectOption("select#documentType", "CC");
    await page.fill("input#documentNumber", genDocumentNumber());
    await page.fill("input#name", "Test User");
    await page.fill("input#email", genEmail());
    await page.fill("input#phone", "3123456789");
    await page.fill("input#password", "Test123!@#");
    await page.fill("input#confirmPassword", "Different123!@#");
    await page.getByRole("button", { name: /registr|crear/i }).click();
    await expect(page.locator(".field-error, .login-error, [role='alert']").first()).toBeVisible({ timeout: 3000 });
  });

  test("debe validar longitud mínima de contraseña", async ({ page }) => {
    await page.selectOption("select#documentType", "CC");
    await page.fill("input#documentNumber", genDocumentNumber());
    await page.fill("input#name", "Test User");
    await page.fill("input#email", genEmail());
    await page.fill("input#phone", "3123456789");
    await page.fill("input#password", "123");
    await page.fill("input#confirmPassword", "123");
    await page.getByRole("button", { name: /registr|crear/i }).click();
    await expect(page.locator(".field-error, .login-error, [role='alert']").first()).toBeVisible({ timeout: 3000 });
  });
});

// Inicio de Sesión

test.describe("Autenticación - Inicio de Sesión", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("debe mostrar el formulario de login correctamente", async ({ page }) => {
    await expect(page.locator("select#documentType")).toBeVisible();
    await expect(page.locator("input#documentNumber")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /ingresar|login|entrar/i })).toBeVisible();
  });

  test.slow();
  test("debe iniciar sesión con credenciales válidas", async ({ page }) => {
    await loginUser(page, {
      documentType: "CC",
      documentNumber: "1234567890",
      password: "Test123!@#",
    });
  });

  test("debe rechazar credenciales inválidas", async ({ page }) => {
    await page.selectOption("select#documentType", "CC");
    await page.fill("input#documentNumber", "1234567890");
    await page.fill("input#password", "WrongPassword123");
    await page.getByRole("button", { name: /ingresar|login/i }).click();
    await expect(page.locator(".login-error, [role='alert']")).toBeVisible({ timeout: 5000 });
  });

  test("debe rechazar usuario inexistente", async ({ page }) => {
    await page.selectOption("select#documentType", "CC");
    await page.fill("input#documentNumber", "9999999999");
    await page.fill("input#password", "Test123!@#");
    await page.getByRole("button", { name: /ingresar|login/i }).click();
    await expect(page.locator(".login-error, [role='alert']")).toBeVisible({ timeout: 5000 });
  });

  test("debe validar campos requeridos", async ({ page }) => {
    await page.getByRole("button", { name: /ingresar|login/i }).click();
    await expect(page.locator("input#documentNumber")).toHaveAttribute("required", "");
  });

  test("debe redirigir a registro desde link", async ({ page }) => {
    const link = page.getByRole("link", { name: /créala|registr|sign up/i });
    await link.click();
    await expect(page).toHaveURL(/register/);
  });
});

// Sesión y navegación

test.describe("Autenticación - Sesión y Navegación", () => {
  const valid = { documentType: "CC", documentNumber: "1234567890", password: "Test123!@#" };

  test.slow();
  test("debe mantener sesión después de login", async ({ page }) => {
    await loginUser(page, valid);
    await page.reload();
    await expect(page).toHaveURL(/dashboard|\//);
  });

  test.slow();
  test("debe cerrar sesión correctamente", async ({ page }) => {
    await loginUser(page, valid);
    await logoutUser(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test("debe redirigir a login si no está autenticado", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
