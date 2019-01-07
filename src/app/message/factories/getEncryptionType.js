import {
    isDraft,
    isSent,
    isSentEncrypted,
    isAuto,
    isInternalEncrypted,
    isExternalEncrypted
} from '../../../helpers/message';

/* @ngInject */
function getEncryptionType(gettextCatalog) {
    const pmTypes = [
        gettextCatalog.getString('End-to-end encrypted message', null, 'Message encryption status'),
        gettextCatalog.getString(
            'End-to-end encrypted message from verified address',
            null,
            'Message encryption status'
        ),
        gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ];

    const pgpTypes = [
        gettextCatalog.getString('PGP-encrypted message', null, 'Message encryption status'),
        gettextCatalog.getString('PGP-encrypted message from verified address', null, 'Message encryption status'),
        gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ];

    const clearTypes = [
        gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
        gettextCatalog.getString('PGP-signed message from verified address', null, 'Message encryption status'),
        gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ];

    const sentEncrypted = [
        gettextCatalog.getString('Sent by you with end-to-end encryption', null, 'Message encryption status'),
        gettextCatalog.getString('Sent by you with end-to-end encryption', null, 'Message encryption status'),
        gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ];

    const autoTypes = [
        gettextCatalog.getString('Sent by ProtonMail with zero access encryption', null, 'Message encryption status')
    ];

    const sentClear = [
        gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
        gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
        gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
    ];

    const draftTypes = [gettextCatalog.getString('Encrypted message', null, 'Message encryption status')];

    return (message) => {
        if (isSentEncrypted(message)) {
            return sentEncrypted;
        }

        if (isAuto(message)) {
            return autoTypes;
        }

        if (isSent(message)) {
            return sentClear;
        }

        if (isDraft(message)) {
            return draftTypes;
        }

        if (isInternalEncrypted(message)) {
            return pmTypes;
        }

        if (isExternalEncrypted(message)) {
            return pgpTypes;
        }

        return clearTypes;
    };
}

export default getEncryptionType;
