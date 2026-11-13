import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { ClaimableAddressModal } from './ClaimableAddressModal';

describe('ClaimableAddressModal', () => {
    const emailAddress = 'test@gmail.com';
    const onClaim = vi.fn().mockResolvedValue(true);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should display the email address', () => {
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={vi.fn()}
                onExit={vi.fn()}
            />
        );

        expect(screen.getByText(emailAddress)).toBeInTheDocument();
    });

    it('should claim the address then close the modal when clicking the connect button', async () => {
        const onClose = vi.fn();
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={onClose}
                onExit={vi.fn()}
            />
        );

        fireEvent.click(screen.getByTestId('ClaimableAddressModal:connectButton'));

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(onClaim).toHaveBeenCalledTimes(1);
    });

    it('should keep the modal open when the claim fails', async () => {
        const onClose = vi.fn();
        onClaim.mockResolvedValueOnce(false);
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={onClose}
                onExit={vi.fn()}
            />
        );

        fireEvent.click(screen.getByTestId('ClaimableAddressModal:connectButton'));

        await waitFor(() => expect(onClaim).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByTestId('ClaimableAddressModal:connectButton')).not.toBeDisabled());
        expect(onClose).not.toHaveBeenCalled();
    });

    it('should not close on Escape while the claim is in progress', async () => {
        const onClose = vi.fn();
        let resolveClaim: (value: boolean) => void = () => {};
        onClaim.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveClaim = resolve)));
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={onClose}
                onExit={vi.fn()}
            />
        );

        fireEvent.click(screen.getByTestId('ClaimableAddressModal:connectButton'));
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onClose).not.toHaveBeenCalled();

        resolveClaim(true);
        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('should open the help link without closing the modal', () => {
        const onClose = vi.fn();
        render(
            <ClaimableAddressModal
                emailAddress={emailAddress}
                onClaim={onClaim}
                open
                onClose={onClose}
                onExit={vi.fn()}
            />
        );

        const link = screen.getByTestId('ClaimableAddressModal:learnMoreLink');
        fireEvent.click(link);

        expect(link).toHaveAttribute('target', '_blank');
        expect(onClose).not.toHaveBeenCalled();
    });
});
