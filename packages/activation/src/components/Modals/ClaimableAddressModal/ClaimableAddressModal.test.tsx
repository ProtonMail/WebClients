import { fireEvent, render, screen } from '@testing-library/react';

import { ClaimableAddressModal } from './ClaimableAddressModal';

const mockCreateNotification = jest.fn();

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));

describe('ClaimableAddressModal', () => {
    const emailAddress = 'test@gmail.com';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display the email address', () => {
        render(<ClaimableAddressModal emailAddress={emailAddress} open onClose={jest.fn()} onExit={jest.fn()} />);

        expect(screen.getByText(emailAddress)).toBeInTheDocument();
    });

    it('should close the modal when clicking the connect button', () => {
        const onClose = jest.fn();
        render(<ClaimableAddressModal emailAddress={emailAddress} open onClose={onClose} onExit={jest.fn()} />);

        fireEvent.click(screen.getByTestId('ClaimableAddressModal:connectButton'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should open the help link without closing the modal', () => {
        const onClose = jest.fn();
        render(<ClaimableAddressModal emailAddress={emailAddress} open onClose={onClose} onExit={jest.fn()} />);

        const link = screen.getByTestId('ClaimableAddressModal:learnMoreLink');
        fireEvent.click(link);

        expect(link).toHaveAttribute('target', '_blank');
        expect(onClose).not.toHaveBeenCalled();
    });
});
