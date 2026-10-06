import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ClaimableAddressModal } from './ClaimableAddressModal';

describe('ClaimableAddressModal', () => {
    const emailAddress = 'test@gmail.com';
    const onClaim = jest.fn().mockResolvedValue(true);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display the email address', () => {
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={jest.fn()}
                onExit={jest.fn()}
            />
        );

        expect(screen.getByText(emailAddress)).toBeInTheDocument();
    });

    it('should claim the address then close the modal when clicking the connect button', async () => {
        const onClose = jest.fn();
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={onClose}
                onExit={jest.fn()}
            />
        );

        fireEvent.click(screen.getByTestId('ClaimableAddressModal:connectButton'));

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(onClaim).toHaveBeenCalledTimes(1);
    });

    it('should open the help link without closing the modal', () => {
        const onClose = jest.fn();
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={onClose}
                onExit={jest.fn()}
            />
        );

        const link = screen.getByTestId('ClaimableAddressModal:learnMoreLink');
        fireEvent.click(link);

        expect(link).toHaveAttribute('target', '_blank');
        expect(onClose).not.toHaveBeenCalled();
    });
});
