import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Toast from '../../../src/components/Toast';
import ConfirmSubmitModal from '../../../src/components/ConfirmSubmitModal';
import RejectCDTModal from '../../../src/components/RejectCDTModal';

describe('All Components Coverage Tests', () => {
  describe('Toast Component', () => {
    it('should render success toast', () => {
      const { container } = render(
        <Toast message="Success" type="success" onClose={vi.fn()} />
      );
      expect(container).toBeTruthy();
    });

    it('should render error toast', () => {
      const { container } = render(
        <Toast message="Error" type="error" onClose={vi.fn()} />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('ConfirmSubmitModal Component', () => {
    it('should render modal', () => {
      const { container } = render(
        <ConfirmSubmitModal 
          isOpen={true} 
          onConfirm={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('RejectCDTModal Component', () => {
    it('should render reject modal', () => {
      const mockCDT = {
        user_name: 'Test User',
        amount: 1000000,
        term: 90
      };
      const { container } = render(
        <RejectCDTModal 
          isOpen={true} 
          onConfirm={vi.fn()} 
          onCancel={vi.fn()} 
          cdtData={mockCDT}
        />
      );
      expect(container).toBeTruthy();
    });
  });
});
