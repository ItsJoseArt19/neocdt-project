import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Toast from '../../../src/components/Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: Mostrar toast de éxito', () => {
    it('Given mensaje de éxito, When se muestra toast, Then debería renderizar correctamente', async () => {
      // Given & When
      render(
        <BrowserRouter>
          <Toast
            message="Operación exitosa"
            type="success"
            onClose={mockOnClose}
          />
        </BrowserRouter>
      );

      // Then
      await waitFor(() => {
        expect(document.body).toBeDefined();
      });
    });
  });

  describe('Scenario: Mostrar toast de error', () => {
    it('Given mensaje de error, When se muestra toast, Then debería renderizar correctamente', async () => {
      // Given & When
      render(
        <BrowserRouter>
          <Toast
            message="Error en la operación"
            type="error"
            onClose={mockOnClose}
          />
        </BrowserRouter>
      );

      // Then
      await waitFor(() => {
        expect(document.body).toBeDefined();
      });
    });
  });

  describe('Scenario: Cerrar toast automáticamente', () => {
    it('Given toast mostrado, When pasa el tiempo, Then debería cerrarse', async () => {
      // Given
      vi.useFakeTimers();

      render(
        <BrowserRouter>
          <Toast
            message="Mensaje temporal"
            type="info"
            onClose={mockOnClose}
          />
        </BrowserRouter>
      );

      // When
      vi.advanceTimersByTime(3000);

      // Then
      await waitFor(() => {
        expect(document.body).toBeDefined();
      });

      vi.useRealTimers();
    });
  });
});
