import { act } from 'react';

import type { PublicKeyReference } from '@protontech/crypto';
import { fireEvent, render, screen } from '@testing-library/react';

import { useContactsMap } from '@proton/mail-message/hooks/contact/useContacts';
import type { MessageVerification } from '@proton/mail-message/store/messages/messagesTypes';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import { message } from '../../../../helpers/tests/pinKeys';
import { tick } from '../../../../helpers/tests/render';
import ExtraAskResign from './ExtraAskResign';

vi.mock('@proton/components/hooks/useGetEncryptionPreferences', () => ({
    __esModule: true,
    default: () => async () => ({ pinnedKeys: [] }),
}));
vi.mock('@proton/app-context/useApi', () => ({
    useApi: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ Contact: { Cards: [], ContactEmails: [] } })),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('@proton/account/userKeys/hooks', () => ({ useGetUserKeys: () => vi.fn() }));

vi.mock('@proton/mail-message/hooks/contact/useContacts');
const mockUseContactsMap = vi.mocked(useContactsMap);

const getMessageVerification = (pinnedKeysVerified: boolean, pinnedKeys?: PublicKeyReference[]) => {
    return {
        pinnedKeysVerified,
        senderPinnedKeys: pinnedKeys,
    } as MessageVerification;
};

describe('Extra ask resign banner', () => {
    beforeEach(() => {
        mockUseContactsMap.mockReturnValue({});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should not display the extra ask resign banner when sender is verified and keys are pinned', () => {
        render(
            <ExtraAskResign
                message={message}
                messageVerification={getMessageVerification(true, [{} as PublicKeyReference])}
                onResignContact={vi.fn()}
            />
        );

        expect(screen.queryByTestId('extra-ask-resign:banner')).toBeNull();
    });

    it('should not display the extra ask resign banner when sender is verified and no keys are pinned', () => {
        render(
            <ExtraAskResign
                message={message}
                messageVerification={getMessageVerification(true)}
                onResignContact={vi.fn()}
            />
        );

        expect(screen.queryByTestId('extra-ask-resign:banner')).toBeNull();
    });

    it('should not display the extra ask resign banner when sender is not verified and no keys are pinned', () => {
        render(
            <ExtraAskResign
                message={message}
                messageVerification={getMessageVerification(false)}
                onResignContact={vi.fn()}
            />
        );

        expect(screen.queryByTestId('extra-ask-resign:banner')).toBeNull();
    });

    it('should display the extra ask resign banner when sender is not verified and keys are pinned', async () => {
        mockUseContactsMap.mockReturnValue({
            'sender@outside.com': { ContactID: 'contactID', Email: 'sender@outside.com' } as ContactEmail,
        });

        render(
            <ExtraAskResign
                message={message}
                messageVerification={getMessageVerification(false, [{} as PublicKeyReference])}
                onResignContact={vi.fn()}
            />
        );

        screen.getByTestId('extra-ask-resign:banner');

        fireEvent.click(screen.getByText('Verify'));
        await act(() => tick());

        screen.getByText('Trust pinned keys?');
    });
});
