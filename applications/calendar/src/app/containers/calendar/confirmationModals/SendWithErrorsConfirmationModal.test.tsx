import { render } from '@testing-library/react';

import { MIME_TYPES } from '@proton/shared/lib/constants';
import {
    ENCRYPTION_PREFERENCES_ERROR_TYPES,
    EncryptionPreferencesError,
} from '@proton/shared/lib/mail/encryptionPreferences';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';
import { veventBuilder } from '@proton/testing/index';
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
});
