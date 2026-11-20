import { render, screen } from '@testing-library/react';

import { GlobalScheduleModal } from './GlobalScheduleModal';

describe('GlobalScheduleModal', () => {
    it('should open the modal when mounted', () => {
        render(
            <GlobalScheduleModal
                value={{ isMessage: true, onConfirm: vi.fn() }}
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
