import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import {
    inSigningPeriod,
    isAuto,
    isDraft,
    isExternalEncrypted,
    isImported,
    isInternalEncrypted,
    isSent,
    isSentEncrypted,
} from '@proton/shared/lib/mail/messages';

export const I18N = {
    pm: [
        c('Message encryption status').t`End-to-end encrypted message`,
        c('Message encryption status').t`End-to-end encrypted message from verified address`,
        c('Message encryption status').t`Sender verification failed`,
    ],
    pgp: [
        c('Message encryption status').t`PGP-encrypted message`,
        c('Message encryption status').t`PGP-encrypted message from verified address`,
        c('Message encryption status').t`Sender verification failed`,
    ],
    clear: [
        c('Message encryption status').t`Stored with zero access encryption`,
        c('Message encryption status').t`PGP-signed message from verified address`,
        c('Message encryption status').t`Sender verification failed`,
    ],
    sentEncrypted: [
        c('Message encryption status').t`Sent by you with end-to-end encryption`,
        c('Message encryption status').t`Sent by you with end-to-end encryption`,
        c('Message encryption status').t`Sender verification failed`,
    ],
    auto: [c('Message encryption status').t`Sent by ${MAIL_APP_NAME} with zero access encryption`],
    sentClear: [
        c('Message encryption status').t`Stored with zero access encryption`,
        c('Message encryption status').t`Stored with zero access encryption`,
        c('Message encryption status').t`Sender verification failed`,
    ],
    draft: [c('Message encryption status').t`Encrypted message`],
};

export const getFromType = (message) => {
    if (isSentEncrypted(message)) {
        return I18N.sentEncrypted;
    }

    if (isAuto(message)) {
        return I18N.auto;
    }

    if (isSent(message)) {
        return I18N.sentClear;
    }

    if (isDraft(message)) {
        return I18N.draft;
    }

    if (isInternalEncrypted(message)) {
        return I18N.pm;
    }

    if (isExternalEncrypted(message)) {
        return I18N.pgp;
    }

    return I18N.clear;
};

export const getEncryptionType = ({ data: message = {}, verified = 0 }) => {
    const encType = getFromType(message);

    if (encType.length > verified) {
        // Old messages are not signed, so missing sender signatures should be treated like external missing signatures, no warning
        if (!inSigningPeriod(message) && isSentEncrypted(message) && !isImported(message)) {
            return encType[0];
        }

        return encType[verified];
    }

    return encType[0];
};
