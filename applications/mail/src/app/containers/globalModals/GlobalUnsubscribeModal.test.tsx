import { render, screen } from '@testing-library/react';

import { GlobalUnsubscribeModal } from './GlobalUnsubscribeModal';

vi.mock('@proton/mail/hooks/useUpdateMailSetting', () => ({
    useUpdateMailSetting: () => ({ update: vi.fn() }),
}));

describe('GlobalUnsubscribeModal', () => {
    it('should open the modal when mounted', () => {
        render(
            <GlobalUnsubscribeModal
                value={{
                    isMessage: true,
                    elementLength: 10,
                    onConfirm: vi.fn(),
                }}
                modalProps={{
                    open: true,
                    onClose: vi.fn(),
                    onExit: vi.fn(),
                }}
            />
        );

        expect(screen.getByTestId('confirm-spam-unsub-button')).toBeInTheDocument();
    });
});
