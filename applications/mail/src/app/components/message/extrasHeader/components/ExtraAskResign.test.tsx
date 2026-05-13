import { act } from 'react';

import type { PublicKeyReference } from '@protontech/crypto';
import { fireEvent, render, screen } from '@testing-library/react';

import type { MessageVerification } from '@proton/mail/store/messages/messagesTypes';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { tick } from '../../../../helpers/test/helper';
import { message } from '../../../../helpers/test/pinKeys';
import { useContactsMap } from '../../../../hooks/contact/useContacts';
import ExtraAskResign from './ExtraAskResign';

jest.mock('@proton/components/hooks/useGetEncryptionPreferences', () => ({
    __esModule: true,
    default: () => async () => ({ pinnedKeys: [] }),
}));
jest.mock(
    '@proton/components/hooks/useApi',
    () => () => jest.fn().mockResolvedValue({ Contact: { Cards: [], ContactEmails: [] } })
);
jest.mock('@proton/components/hooks/useNotifications', () => () => ({ createNotification: jest.fn() }));
jest.mock('@proton/account/userKeys/hooks', () => ({ useGetUserKeys: () => jest.fn() }));

jest.mock('../../../../hooks/contact/useContacts');
const mockUseContactsMap = jest.mocked(useContactsMap);

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
        jest.clearAllMocks();
    });

    it('should not display the extra ask resign banner when sender is verified and keys are pinned', () => {
        render(
            <ExtraAskResign
                message={message}
                messageVerification={getMessageVerification(true, [{} as PublicKeyReference])}
                onResignContact={jest.fn()}
            />
        );

        expect(screen.queryByTestId('extra-ask-resign:banner')).toBeNull();
    });

    it('should not display the extra ask resign banner when sender is verified and no keys are pinned', () => {
        render(
            <ExtraAskResign
                message={message}
                messageVerification={getMessageVerification(true)}
                onResignContact={jest.fn()}
            />
        );

        expect(screen.queryByTestId('extra-ask-resign:banner')).toBeNull();
    });

    it('should not display the extra ask resign banner when sender is not verified and no keys are pinned', () => {
        render(
            <ExtraAskResign
                message={message}
                messageVerification={getMessageVerification(false)}
                onResignContact={jest.fn()}
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
                onResignContact={jest.fn()}
            />
        );

        screen.getByTestId('extra-ask-resign:banner');

        fireEvent.click(screen.getByText('Verify'));
        await act(() => tick());

        screen.getByText('Trust pinned keys?');
    });
});
