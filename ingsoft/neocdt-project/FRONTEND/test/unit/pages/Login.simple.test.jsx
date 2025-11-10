import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../src/pages/Login';

describe('Login Page - HU-02: Inicio de sesión', () => {
  it('should render the login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('should render document type selector', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(document.getElementById('documentType')).toBeInTheDocument();
  });

  it('should render document number input', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(document.getElementById('documentNumber')).toBeInTheDocument();
  });

  it('should render password input', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(document.getElementById('password')).toBeInTheDocument();
  });

  it('should have link to register page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/¿No tienes cuenta?/i)).toBeInTheDocument();
  });

  it('should render NeoBank branding', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/NeoBank/i)).toBeInTheDocument();
  });
});
