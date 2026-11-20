import { render, screen } from '@testing-library/react';

import { GlobalSnoozeModal } from './GlobalSnoozeModal';

describe('GlobalSnoozeModal', () => {
    it('should open the modal when mounted', () => {
        render(
            <GlobalSnoozeModal
                value={{ onConfirm: vi.fn() }}
                modalProps={{
                    open: true,
                    onClose: vi.fn(),
                    onExit: vi.fn(),
                }}
            />
        );

        expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
    });
});
