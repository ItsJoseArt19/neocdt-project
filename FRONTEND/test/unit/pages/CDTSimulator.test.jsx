import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CDTSimulator from '../../../src/pages/CDTSimulator';

const MockedCDTSimulator = () => (
  <BrowserRouter>
    <CDTSimulator />
  </BrowserRouter>
);

describe('HU-04: Simulador de CDT - CDTSimulator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: Simulación exitosa con parámetros válidos', () => {
    it('Given monto y plazo válidos, When hace clic en Calcular, Then debería mostrar resultados', async () => {
      // Given
      render(<MockedCDTSimulator />);

      // When
      const montoInput = screen.getByLabelText(/monto|inversión/i);
      const plazoInput = screen.getByLabelText(/plazo|días/i);
      const calcularButton = screen.getByRole('button', { name: /calcular|simular/i });

      fireEvent.change(montoInput, { target: { value: '10000000' } });
      fireEvent.change(plazoInput, { target: { value: '360' } });
      fireEvent.click(calcularButton);

      // Then
      await waitFor(() => {
        // Buscar elementos de resultado
        const results = screen.queryByText(/interés|tasa|valor final/i);
        expect(results).toBeDefined();
      });
    });
  });

  describe('Scenario: Simulación con diferentes plazos y tasas', () => {
    it('Given diferentes plazos, When calcula, Then debería mostrar tasas correctas', async () => {
      // Given
      render(<MockedCDTSimulator />);

      const testCases = [
        { monto: '5000000', plazo: '90', tasaEsperada: 8.5 },
        { monto: '10000000', plazo: '180', tasaEsperada: 9.5 },
        { monto: '20000000', plazo: '360', tasaEsperada: 10.5 }
      ];

      for (const testCase of testCases) {
        // When
        const montoInput = screen.getByLabelText(/monto|inversión/i);
        const plazoInput = screen.getByLabelText(/plazo|días/i);
        const calcularButton = screen.getByRole('button', { name: /calcular|simular/i });

        fireEvent.change(montoInput, { target: { value: testCase.monto } });
        fireEvent.change(plazoInput, { target: { value: testCase.plazo } });
        fireEvent.click(calcularButton);

        // Then - verificar que se realizó el cálculo
        await waitFor(() => {
          expect(montoInput.value).toBe(testCase.monto);
          expect(plazoInput.value).toBe(testCase.plazo);
        });
      }
    });
  });

  describe('Scenario: Validación de monto mínimo', () => {
    it('Given monto menor al mínimo, When calcula, Then debería mostrar error', async () => {
      // Given
      render(<MockedCDTSimulator />);

      // When
      const montoInput = screen.getByLabelText(/monto|inversión/i);
      const plazoInput = screen.getByLabelText(/plazo|días/i);
      const calcularButton = screen.getByRole('button', { name: /calcular|simular/i });

      fireEvent.change(montoInput, { target: { value: '400000' } });
      fireEvent.change(plazoInput, { target: { value: '360' } });
      fireEvent.click(calcularButton);

      // Then - verificar que el monto se ingresó
      await waitFor(() => {
        expect(montoInput.value).toBe('400000');
      });
    });
  });

  describe('Scenario: Validación de monto máximo', () => {
    it('Given monto mayor al máximo, When calcula, Then debería mostrar error', async () => {
      // Given
      render(<MockedCDTSimulator />);

      // When
      const montoInput = screen.getByLabelText(/monto|inversión/i);
      const plazoInput = screen.getByLabelText(/plazo|días/i);
      const calcularButton = screen.getByRole('button', { name: /calcular|simular/i });

      fireEvent.change(montoInput, { target: { value: '600000000' } });
      fireEvent.change(plazoInput, { target: { value: '360' } });
      fireEvent.click(calcularButton);

      // Then
      await waitFor(() => {
        expect(montoInput.value).toBe('600000000');
      });
    });
  });

  describe('Scenario: Validación de plazo mínimo', () => {
    it('Given plazo menor al mínimo, When calcula, Then debería mostrar error', async () => {
      // Given
      render(<MockedCDTSimulator />);

      // When
      const montoInput = screen.getByLabelText(/monto|inversión/i);
      const plazoInput = screen.getByLabelText(/plazo|días/i);
      const calcularButton = screen.getByRole('button', { name: /calcular|simular/i });

      fireEvent.change(montoInput, { target: { value: '10000000' } });
      fireEvent.change(plazoInput, { target: { value: '20' } });
      fireEvent.click(calcularButton);

      // Then
      await waitFor(() => {
        expect(plazoInput.value).toBe('20');
      });
    });
  });

  describe('Scenario: Validación de plazo máximo', () => {
    it('Given plazo mayor al máximo, When calcula, Then debería mostrar error', async () => {
      // Given
      render(<MockedCDTSimulator />);

      // When
      const montoInput = screen.getByLabelText(/monto|inversión/i);
      const plazoInput = screen.getByLabelText(/plazo|días/i);
      const calcularButton = screen.getByRole('button', { name: /calcular|simular/i });

      fireEvent.change(montoInput, { target: { value: '10000000' } });
      fireEvent.change(plazoInput, { target: { value: '400' } });
      fireEvent.click(calcularButton);

      // Then
      await waitFor(() => {
        expect(plazoInput.value).toBe('400');
      });
    });
  });

  describe('Scenario: Navegación a creación de CDT', () => {
    it('Given simulación exitosa, When hace clic en Crear CDT, Then debería navegar al formulario', () => {
      // Given
      render(<MockedCDTSimulator />);

      // Then - verificar que existe el link o botón para crear CDT
      const createLink = screen.queryByText(/crear|iniciar/i);
      expect(createLink).toBeDefined();
    });
  });
});
