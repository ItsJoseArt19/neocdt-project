import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../../src/pages/Register';

describe('Register Page - HU-01: Registro de usuario', () => {
  it('should render the registration form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('button', { name: /registrar/i })).toBeInTheDocument();
  });

  it('should render all form inputs', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(document.getElementById('documentType')).toBeInTheDocument();
    expect(document.getElementById('documentNumber')).toBeInTheDocument();
    expect(document.getElementById('name')).toBeInTheDocument();
    expect(document.getElementById('email')).toBeInTheDocument();
    expect(document.getElementById('phone')).toBeInTheDocument();
    expect(document.getElementById('password')).toBeInTheDocument();
    expect(document.getElementById('confirmPassword')).toBeInTheDocument();
  });

  it('should have document type selector', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    const select = document.getElementById('documentType');
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBeGreaterThan(1);
  });

  it('should render benefits section', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/¿Por qué elegir NeoBank?/i)).toBeInTheDocument();
  });

  it('should have link to login page', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/¿Ya tienes cuenta?/i)).toBeInTheDocument();
  });

  it('should render password hint', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Debe contener: mayúsculas, minúsculas y números/i)).toBeInTheDocument();
  });
});
