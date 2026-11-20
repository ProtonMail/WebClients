import { render, screen } from '@testing-library/react';

import { GlobalUnsubscribeModal } from './GlobalUnsubscribeModal';

jest.mock('@proton/mail/hooks/useUpdateMailSetting', () => ({
    useUpdateMailSetting: () => ({ update: jest.fn() }),
}));

describe('GlobalUnsubscribeModal', () => {
    it('should open the modal when mounted', () => {
        render(
            <GlobalUnsubscribeModal
                value={{
                    isMessage: true,
                    elementLength: 10,
                    onConfirm: jest.fn(),
                }}
                modalProps={{
                    open: true,
                    onClose: jest.fn(),
                    onExit: jest.fn(),
                }}
            />
        );

        expect(screen.getByTestId('confirm-spam-unsub-button')).toBeInTheDocument();
    });
});
