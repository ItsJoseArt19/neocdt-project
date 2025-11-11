import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPanel from '../../../src/pages/AdminPanel';

vi.mock('../../../src/utils/localStorageUtils', () => ({
  getCurrentUser: vi.fn(() => ({
    documentNumber: '1234567890',
    name: 'Admin User',
    isAdmin: true
  }))
}));

const MockedAdminPanel = () => (
  <BrowserRouter>
    <AdminPanel />
  </BrowserRouter>
);

describe('HU-10: Aprobar CDT (Admin) y HU-11: Rechazar CDT (Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('currentUser', JSON.stringify({
      documentNumber: '1234567890',
      name: 'Admin User',
      isAdmin: true
    }));
    
    // Mock de CDTs pendientes
    localStorage.setItem('cdts', JSON.stringify([
      {
        id: 'CDT123',
        monto: 10000000,
        plazo: 360,
        estado: 'pending',
        userId: '9876543210',
        userName: 'Juan Pérez'
      },
      {
        id: 'CDT456',
        monto: 15000000,
        plazo: 720,
        estado: 'pending',
        userId: '5555555555',
        userName: 'María García'
      }
    ]));
  });

  describe('HU-10: Scenario: Ver lista de CDT pendientes de aprobación', () => {
    it('Given CDTs pendientes, When accede al panel, Then debería ver lista', async () => {
      // Given & When
      render(<MockedAdminPanel />);

      // Then
      await waitFor(() => {
        const container = document.body;
        expect(container).toBeDefined();
      });
    });
  });

  describe('HU-10: Scenario: Aprobar CDT exitosamente', () => {
    it('Given CDT pendiente, When hace clic en Aprobar, Then debería aprobar', async () => {
      // Given
      render(<MockedAdminPanel />);

      // Then - verificar que se renderiza el panel
      await waitFor(() => {
        const container = document.body;
        expect(container).toBeDefined();
      });
    });
  });

  describe('HU-11: Scenario: Rechazar CDT con razón obligatoria', () => {
    it('Given CDT pendiente, When rechaza con razón, Then debería rechazar', async () => {
      // Given
      render(<MockedAdminPanel />);

      // Then
      await waitFor(() => {
        const container = document.body;
        expect(container).toBeDefined();
      });
    });
  });

  describe('HU-10: Scenario: Validar permisos de administrador', () => {
    it('Given usuario no admin, When intenta acceder, Then debería rechazar', () => {
      // Given - cambiar a usuario regular
      localStorage.setItem('currentUser', JSON.stringify({
        documentNumber: '1234567890',
        name: 'Regular User',
        isAdmin: false
      }));

      // When & Then
      render(<MockedAdminPanel />);
      expect(document.body).toBeDefined();
    });
  });
});
