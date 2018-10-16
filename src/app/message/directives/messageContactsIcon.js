/* @ngInject */
function messageContacts(gettextCatalog) {
    const STATUS = {
        ENCRYPTION_ENABLED: 1,
        SIGNING_ENABLED: 2,
        PINNING_ENABLED: 4,
        PGP_MIME: 8,
        PGP_INLINE: 16,
        LOADING_CRYPT_INFO: 32
    };

    const I18N = {
        [STATUS.PGP_MIME | !STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'PGP-signed',
            null,
            'Info'
        ),
        [STATUS.PGP_MIME | STATUS.ENCRYPTION_ENABLED | !STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'PGP-encrypted',
            null,
            'Info'
        ),
        [STATUS.PGP_MIME | STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'PGP-encrypted',
            null,
            'Info'
        ),
        [STATUS.PGP_INLINE | !STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'PGP-signed',
            null,
            'Info'
        ),
        [STATUS.PGP_INLINE | STATUS.ENCRYPTION_ENABLED | !STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'PGP-encrypted',
            null,
            'Info'
        ),
        [STATUS.PGP_INLINE | STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'PGP-encrypted',
            null,
            'Info'
        ),
        [STATUS.PINNING_ENABLED | !STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'End-to-end encrypted to verified recipient',
            null,
            'Info'
        ),
        [STATUS.PINNING_ENABLED | STATUS.ENCRYPTION_ENABLED | !STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'End-to-end encrypted to verified recipient',
            null,
            'Info'
        ),
        [STATUS.PINNING_ENABLED | STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'End-to-end encrypted to verified recipient',
            null,
            'Info'
        ),
        [!STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'End-to-end encrypted',
            null,
            'Info'
        ),
        [STATUS.ENCRYPTION_ENABLED | !STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'End-to-end encrypted',
            null,
            'Info'
        ),
        [STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED]: gettextCatalog.getString(
            'End-to-end encrypted',
            null,
            'Info'
        )
    };
    return {
        templateUrl: require('../../../templates/message/messageContactsIcon.tpl.html'),
        replace: true,
        link(scope) {
            const getStatusCode = () => {
                const pgpMime =
                    scope.email.Encryption.startsWith('pgp-mime') || scope.email.Authentication.startsWith('pgp-mime');
                const pgpInline =
                    scope.email.Encryption.startsWith('pgp-inline') ||
                    scope.email.Authentication.startsWith('pgp-inline');
                const pinned =
                    scope.email.Encryption === 'pgp-pm-pinned' || scope.email.Authentication === 'pgp-pm-pinned';
                const encrypted = scope.email.Encryption !== 'none';
                const signed = scope.email.Authentication !== 'none';
                return (
                    encrypted * STATUS.ENCRYPTION_ENABLED +
                    signed * STATUS.SIGNING_ENABLED +
                    pgpMime * STATUS.PGP_MIME +
                    pgpInline * STATUS.PGP_INLINE +
                    pinned * STATUS.PINNING_ENABLED
                );
            };

            const getTooltip = () => {
                // turn into a bitmask value :-)
                const status = getStatusCode();

                return I18N[status] || '';
            };

            scope.email.tooltip = getTooltip();
        }
    };
}
export default messageContacts;
