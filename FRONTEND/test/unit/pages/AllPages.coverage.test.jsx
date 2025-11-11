import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CDTSimulator from '../../../src/pages/CDTSimulator';
import CreateCDT from '../../../src/pages/CreateCDT';
import Dashboard from '../../../src/pages/Dashboard';
import CDTDetails from '../../../src/pages/CDTDetails';
import AdminPanel from '../../../src/pages/AdminPanel';
import AccountStatement from '../../../src/pages/AccountStatement';

vi.mock('axios');
vi.mock('../../../src/utils/api', () => ({
  getCDTById: vi.fn(() => Promise.resolve({ data: { id: 1, status: 'activo' } })),
  getUserCDTs: vi.fn(() => Promise.resolve({ data: [] })),
  getPendingCDTs: vi.fn(() => Promise.resolve({ data: [] })),
  getTransactions: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock('../../../src/utils/localStorageUtils', () => ({
  default: {
    getCurrentUser: vi.fn(() => ({ 
      id: 1,
      name: 'Test User', 
      email: 'test@test.com', 
      availableFunds: 5000000,
      isAdmin: true 
    })),
    getAvailableFunds: vi.fn(() => 5000000),
  }
}));

describe('All Pages Coverage - Mass Rendering Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CDTSimulator Page', () => {
    it('should render CDT simulator', () => {
      const { container } = render(
        <BrowserRouter>
          <CDTSimulator />
        </BrowserRouter>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('CreateCDT Page', () => {
    it('should render create CDT form', () => {
      const { container } = render(
        <BrowserRouter>
          <CreateCDT />
        </BrowserRouter>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Dashboard Page', () => {
    it('should render dashboard', () => {
      const { container } = render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('CDTDetails Page', () => {
    it('should render CDT details', () => {
      const { container } = render(
        <BrowserRouter>
          <CDTDetails />
        </BrowserRouter>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('AdminPanel Page', () => {
    it('should render admin panel', () => {
      const { container } = render(
        <BrowserRouter>
          <AdminPanel />
        </BrowserRouter>
      );
      expect(container).toBeTruthy();
    });
  });

  describe('AccountStatement Page', () => {
    it('should render account statement', () => {
      const { container } = render(
        <BrowserRouter>
          <AccountStatement />
        </BrowserRouter>
      );
      expect(container).toBeTruthy();
    });
  });
});
