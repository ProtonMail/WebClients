import { render, screen } from '@testing-library/react';

import { GlobalSnoozeModal } from './GlobalSnoozeModal';

describe('GlobalSnoozeModal', () => {
    it('should open the modal when mounted', () => {
        render(
            <GlobalSnoozeModal
                value={{ onConfirm: jest.fn() }}
                modalProps={{
                    open: true,
                    onClose: jest.fn(),
                    onExit: jest.fn(),
                }}
            />
        );

        expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
    });
});
