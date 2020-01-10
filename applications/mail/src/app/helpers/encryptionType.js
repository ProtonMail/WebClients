import { c } from 'ttag';

import {
    isSentEncrypted,
    isAuto,
    isSent,
    isDraft,
    isInternalEncrypted,
    isExternalEncrypted,
    inSigningPeriod,
    isImported
} from './message/messages';

const I18N = {
    pm: [
        c('Message encryption status').t`End-to-end encrypted message`,
        // gettextCatalog.getString('End-to-end encrypted message', null, 'Message encryption status'),
        c('Message encryption status').t`End-to-end encrypted message from verified address`,
        // gettextCatalog.getString(
        //     'End-to-end encrypted message from verified address',
        //     null,
        //     'Message encryption status'
        // ),
        c('Message encryption status').t`Sender verification failed`
        // gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ],
    pgp: [
        c('Message encryption status').t`PGP-encrypted message`,
        // gettextCatalog.getString('PGP-encrypted message', null, 'Message encryption status'),
        c('Message encryption status').t`PGP-encrypted message from verified address`,
        // gettextCatalog.getString('PGP-encrypted message from verified address', null, 'Message encryption status'),
        c('Message encryption status').t`Sender verification failed`
        // gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ],
    clear: [
        c('Message encryption status').t`Stored with zero access encryption`,
        // gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
        c('Message encryption status').t`PGP-signed message from verified address`,
        // gettextCatalog.getString('PGP-signed message from verified address', null, 'Message encryption status'),
        c('Message encryption status').t`Sender verification failed`
        // gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ],
    sentEncrypted: [
        c('Message encryption status').t`Sent by you with end-to-end encryption`,
        // gettextCatalog.getString('Sent by you with end-to-end encryption', null, 'Message encryption status'),
        c('Message encryption status').t`Sent by you with end-to-end encryption`,
        // gettextCatalog.getString('Sent by you with end-to-end encryption', null, 'Message encryption status'),
        c('Message encryption status').t`Sender verification failed`
        // gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ],
    auto: [
        c('Message encryption status').t`Sent by ProtonMail with zero access encryption`
        // gettextCatalog.getString('Sent by ProtonMail with zero access encryption', null, 'Message encryption status')
    ],
    sentClear: [
        c('Message encryption status').t`Stored with zero access encryption`,
        // gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
        c('Message encryption status').t`Stored with zero access encryption`,
        // gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
        c('Message encryption status').t`Sender verification failed`
        // gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ],
    draft: [
        c('Message encryption status').t`Encrypted message`
        //gettextCatalog.getString('Encrypted message', null, 'Message encryption status')
    ]
};

const getFromType = (message) => {
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
