import {
    isDraft,
    isSent,
    isSentEncrypted,
    isAuto,
    isInternalEncrypted,
    isExternalEncrypted
} from '../../../helpers/message';

/* @ngInject */
function getEncryptionType(gettextCatalog, translator) {

    const I18N = translator(() => ({
        pm: [
            gettextCatalog.getString('End-to-end encrypted message', null, 'Message encryption status'),
            gettextCatalog.getString(
                'End-to-end encrypted message from verified address',
                null,
                'Message encryption status'
            ),
            gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
        ],
        pgp: [
            gettextCatalog.getString('PGP-encrypted message', null, 'Message encryption status'),
            gettextCatalog.getString('PGP-encrypted message from verified address', null, 'Message encryption status'),
            gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
        ],
        clear: [
            gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
            gettextCatalog.getString('PGP-signed message from verified address', null, 'Message encryption status'),
            gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
        ],
        sentEncrypted: [
            gettextCatalog.getString('Sent by you with end-to-end encryption', null, 'Message encryption status'),
            gettextCatalog.getString('Sent by you with end-to-end encryption', null, 'Message encryption status'),
            gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
        ],
        auto: [
            gettextCatalog.getString('Sent by ProtonMail with zero access encryption', null, 'Message encryption status')
        ],
        sentClear: [
            gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
            gettextCatalog.getString('Stored with zero access encryption', null, 'Message encryption status'),
            gettextCatalog.getString('Sender verification failed', null, 'Message encryption status')
        ],
        draft: [gettextCatalog.getString('Encrypted message', null, 'Message encryption status')]
    }));

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

    return getFromType;
}

export default getEncryptionType;
