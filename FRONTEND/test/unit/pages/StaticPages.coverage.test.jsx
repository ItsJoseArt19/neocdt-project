import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../../src/pages/Home';
import CanalesAtencion from '../../../src/pages/CanalesAtencion';
import Transparencia from '../../../src/pages/Transparencia';
import UserProfile from '../../../src/pages/UserProfile';

vi.mock('../../../src/utils/localStorageUtils', () => ({
  default: {
    getCurrentUser: vi.fn(() => ({ name: 'Test User', email: 'test@test.com', availableFunds: 5000000 })),
  }
}));

describe('Static Pages Rendering Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Home page should render', () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });

  it('CanalesAtencion page should render', () => {
    const { container } = render(
      <BrowserRouter>
        <CanalesAtencion />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });

  it('Transparencia page should render', () => {
    const { container } = render(
      <BrowserRouter>
        <Transparencia />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });

  it('UserProfile page should render', () => {
    const { container} = render(
      <BrowserRouter>
        <UserProfile />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
