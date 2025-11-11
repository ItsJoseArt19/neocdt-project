import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CDTStatusBadge from '../../../src/components/CDTStatusBadge';

describe('CDTStatusBadge Component', () => {
  describe('Status: draft', () => {
    it('should render draft status with correct text and style', () => {
      render(<CDTStatusBadge status="draft" />);
      
      const badge = screen.getByText('Borrador');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('cdt-status-badge', 'status-draft');
      expect(screen.getByText('📝')).toBeInTheDocument();
    });
  });

  describe('Status: pending', () => {
    it('should render pending status with correct text and style', () => {
      render(<CDTStatusBadge status="pending" />);
      
      const badge = screen.getByText('Pendiente');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('cdt-status-badge', 'status-pending');
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });
  });

  describe('Status: active', () => {
    it('should render active status with correct text and style', () => {
      render(<CDTStatusBadge status="active" />);
      
      const badge = screen.getByText('Activo');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('cdt-status-badge', 'status-active');
      expect(screen.getByText('✅')).toBeInTheDocument();
    });
  });

  describe('Status: completed', () => {
    it('should render completed status with correct text and style', () => {
      render(<CDTStatusBadge status="completed" />);
      
      const badge = screen.getByText('Completado');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('cdt-status-badge', 'status-completed');
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
  });

  describe('Status: rejected', () => {
    it('should render rejected status with correct text and style', () => {
      render(<CDTStatusBadge status="rejected" />);
      
      const badge = screen.getByText('Rechazado');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('cdt-status-badge', 'status-rejected');
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  describe('Status: cancelled', () => {
    it('should render cancelled status with correct text and style', () => {
      render(<CDTStatusBadge status="cancelled" />);
      
      const badge = screen.getByText('Cancelado');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('cdt-status-badge', 'status-cancelled');
      expect(screen.getByText('🚫')).toBeInTheDocument();
    });
  });

  describe('Unknown status', () => {
    it('should render unknown status with default style', () => {
      render(<CDTStatusBadge status="unknown" />);
      
      const badge = screen.getByText('unknown');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('cdt-status-badge', 'status-unknown');
      expect(screen.getByText('❓')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined status', () => {
      render(<CDTStatusBadge />);
      
      // Cuando es undefined, muestra el icono ❓
      const icon = screen.getByText('❓');
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toHaveClass('cdt-status-badge', 'status-unknown');
    });

    it('should handle null status', () => {
      render(<CDTStatusBadge status={null} />);
      
      // Cuando es null, muestra el icono ❓
      const icon = screen.getByText('❓');
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toHaveClass('cdt-status-badge', 'status-unknown');
    });

    it('should handle empty string status', () => {
      render(<CDTStatusBadge status="" />);
      
      // Cuando es string vacío, muestra el icono ❓
      const icon = screen.getByText('❓');
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toHaveClass('cdt-status-badge', 'status-unknown');
    });
  });
});
