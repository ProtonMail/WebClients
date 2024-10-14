import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';

import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { mockUseAddresses, mockUseNotifications } from '@proton/testing/lib/vitest';
import {
    apiWalletAccountOneA,
    getAddressKey,
    mockUseRemainingInvites,
    mockUseWalletApiClients,
    mockUseWalletDispatch,
} from '@proton/wallet/tests';

import { InvitesButton } from '.';

describe('InvitesButton', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    beforeEach(async () => {
        mockUseRemainingInvites();
        mockUseWalletDispatch();
        mockUseWalletApiClients();
        mockUseNotifications();

        const key = await getAddressKey();
        mockUseAddresses([[key.address]]);
    });

    it('should open InvitesModal', async () => {
        render(<InvitesButton walletAccount={apiWalletAccountOneA} />);

        const el = await screen.findByTestId('invite-button');

        await act(async () => {
            await fireEvent.click(el);
        });

        await screen.findByText('Send invite email now');

        const button = await screen.findByTestId('send-invite-confirm-button');
        const inviteeEmailInput = await screen.findByTestId('invitee-email-input');

        await act(async () => {
            await fireEvent.change(inviteeEmailInput, { target: { value: 'test-invite@proton.me' } });
        });
        await act(async () => {
            await fireEvent.click(button);
        });

        await waitFor(() => screen.findByText('Invitation sent to test-invite@proton.me'));

        const closeButton = await screen.findByTestId('invite-sent-close-button');
        await act(async () => {
            await fireEvent.click(closeButton);
        });
    });
});
