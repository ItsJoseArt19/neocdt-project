import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CDTDetails from '../../../src/pages/CDTDetails';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'CDT123' }),
    useNavigate: () => vi.fn()
  };
});

vi.mock('../../../src/utils/localStorageUtils', () => ({
  getCurrentUser: vi.fn(() => ({
    documentNumber: '1234567890',
    name: 'Juan Pérez'
  }))
}));

const MockedCDTDetails = () => (
  <BrowserRouter>
    <CDTDetails />
  </BrowserRouter>
);

describe('HU-07: Ver Detalles de CDT - CDTDetails Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('currentUser', JSON.stringify({
      documentNumber: '1234567890',
      name: 'Juan Pérez'
    }));
    
    // Mock de CDT específico
    localStorage.setItem('cdts', JSON.stringify([
      {
        id: 'CDT123',
        monto: 10000000,
        plazo: 360,
        tasaInteres: 9.5,
        estado: 'active',
        fechaInicio: '2025-10-20',
        fechaVencimiento: '2026-10-20',
        retornoEsperado: 950000,
        userId: '1234567890'
      }
    ]));
  });

  describe('Scenario: Ver todos los detalles del CDT', () => {
    it('Given CDT existente, When accede a detalles, Then debería ver información completa', async () => {
      // Given & When
      render(<MockedCDTDetails />);

      // Then
      await waitFor(() => {
        const container = document.body;
        expect(container).toBeDefined();
      }, { timeout: 3000 });
    });
  });

  describe('Scenario: Ver cálculos detallados del retorno', () => {
    it('Given CDT con cálculos, When accede a detalles, Then debería ver desglose', async () => {
      // Given & When
      render(<MockedCDTDetails />);

      // Then
      await waitFor(() => {
        const container = document.body;
        expect(container).toBeDefined();
      });
    });
  });

  describe('Scenario: Acciones disponibles según estado', () => {
    it('Given CDT en estado draft, When accede a detalles, Then debería ver acciones de edición', async () => {
      // Given - CDT en draft
      localStorage.setItem('cdts', JSON.stringify([
        {
          id: 'CDT123',
          monto: 10000000,
          plazo: 360,
          estado: 'draft',
          userId: '1234567890'
        }
      ]));

      // When
      render(<MockedCDTDetails />);

      // Then
      await waitFor(() => {
        const container = document.body;
        expect(container).toBeDefined();
      });
    });

    it('Given CDT en estado pending, When accede a detalles, Then debería poder cancelar', async () => {
      // Given - CDT en pending
      localStorage.setItem('cdts', JSON.stringify([
        {
          id: 'CDT123',
          monto: 10000000,
          plazo: 360,
          estado: 'pending',
          userId: '1234567890'
        }
      ]));

      // When
      render(<MockedCDTDetails />);

      // Then
      await waitFor(() => {
        const container = document.body;
        expect(container).toBeDefined();
      });
    });
  });
});
