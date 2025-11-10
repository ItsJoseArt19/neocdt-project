// Page Object: LoginPage
import { expect } from "@playwright/test";

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.documentTypeSelect = page.locator("select#documentType");
    this.documentNumberInput = page.locator("input#documentNumber");
    this.passwordInput = page.locator("input#password");
    this.submitButton = page.getByRole("button", { name: /ingresar|login|entrar/i });
  }
  async goto() { await this.page.goto("/login"); }
  async fill({ documentType = "CC", documentNumber = "1234567890", password = "Test123!@#" }) {
    await this.documentTypeSelect.selectOption(documentType);
    await this.documentNumberInput.fill(documentNumber);
    await this.passwordInput.fill(password);
  }
  async submit() { await this.submitButton.click(); }
  async expectLogged() { await expect(this.page).toHaveURL(/dashboard|\//, { timeout: 10000 }); }
}
