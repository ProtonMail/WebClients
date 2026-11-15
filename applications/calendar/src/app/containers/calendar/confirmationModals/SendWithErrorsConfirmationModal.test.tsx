import { fireEvent, render, screen } from '@testing-library/react';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import {
    ENCRYPTION_PREFERENCES_ERROR_TYPES,
    EncryptionPreferencesError,
} from '@proton/shared/lib/mail/encryptionPreferences';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';
import { veventBuilder } from '@proton/shared/testing/calendarBuilders';
import noop from '@proton/utils/noop';

import { INVITE_ACTION_TYPES } from '../../../interfaces/Invite';
import SendWithErrorsConfirmationModal from './SendWithErrorsConfirmationModal';

const sendPreferencesMap = {
    error: new EncryptionPreferencesError(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR, 'error'),
    isInternal: false,
    encrypt: false,
    sign: false,
    pgpScheme: PACKAGE_TYPE.SEND_CLEAR,
    mimeType: MIME_TYPES.PLAINTEXT,
    publicKeys: [],
    hasApiKeys: false,
    hasPinnedKeys: false,
    encryptionDisabled: false,
};

describe('SendWithErrorsConfirmationModal', () => {
    it('works with only one CTA', () => {
        const vevent = veventBuilder({});
        render(
            <SendWithErrorsConfirmationModal
                sendPreferencesMap={{
                    'alice@pm.me': sendPreferencesMap,
                }}
                inviteActions={{ selfAddress: undefined, type: INVITE_ACTION_TYPES.DECLINE_INVITATION }}
                vevent={vevent}
                cancelVevent={vevent}
                onClose={noop}
                onConfirm={noop}
                isOpen={true}
            />
        );
    });

    it.each([true, false])('shows a "Got it" button that closes the modal when isProtonProtonInvite is %s', (isPP) => {
        const vevent = veventBuilder({});
        const onClose = jest.fn();
        render(
            <SendWithErrorsConfirmationModal
                sendPreferencesMap={{
                    'alice@pm.me': sendPreferencesMap,
                }}
                inviteActions={
                    {
                        selfAddress: undefined,
                        type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
                        isProtonProtonInvite: isPP,
                    } as any
                }
                vevent={vevent}
                cancelVevent={vevent}
                onClose={onClose}
                onConfirm={noop}
                isOpen={true}
            />
        );
        expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
        expect(onClose).toHaveBeenCalled();
    });
});
