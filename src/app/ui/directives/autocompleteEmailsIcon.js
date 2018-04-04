/* @ngInject */
function autocompleteEmailsIcon(dispatchers, tooltipModel, gettextCatalog) {
    const I18N = {
        LOADING_CRYPT_INFO: gettextCatalog.getString('Loading encryption info...'),
        PGP_MIME_SIGN: gettextCatalog.getString('PGP-signed'),
        PGP_MIME_ENCRYPT_SIGN: gettextCatalog.getString('PGP-encrypted'),
        PGP_INLINE_SIGN: gettextCatalog.getString('PGP-signed'),
        PGP_INLINE_ENCRYPT_SIGN: gettextCatalog.getString('PGP-encrypted'),
        PINNED_ENCRYPT_SIGN: gettextCatalog.getString('End-to-end encrypted to verified recipient'),
        PM_ENCRYPT_SIGN: gettextCatalog.getString('End-to-end encrypted'),
        PM_EO: gettextCatalog.getString('End-to-end encrypted')
    };
    const STATUS = {
        ENCRYPTION_ENABLED: 1,
        SIGNING_ENABLED: 2,
        PINNING_ENABLED: 4,
        PGP_MIME: 8,
        PGP_INLINE: 16,
        PM_EO: 32,
        LOADING_CRYPT_INFO: 64
    };
    return {
        replace: true,
        templateUrl: require('../../../templates/ui/autoCompleteEmailsIcon.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const getStatusCode = () => {
                return scope.email.loadCryptInfo * STATUS.LOADING_CRYPT_INFO +
                    scope.email.encrypt * STATUS.ENCRYPTION_ENABLED +
                    scope.email.sign * STATUS.SIGNING_ENABLED +
                    (scope.email.isPgp && scope.email.isPgpMime) * STATUS.PGP_MIME +
                    (scope.email.isPgp && !scope.email.isPgpMime) * STATUS.PGP_INLINE +
                    (scope.email.isEO) * STATUS.PM_EO +
                    (scope.email.isPinned && !scope.email.isPgp) * STATUS.PINNING_ENABLED;
            };

            const getTooltip = () => {
                // turn into a bitmask value :-)
                const status = getStatusCode();
                switch (status) {
                    case STATUS.PGP_MIME | !STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED:
                        return I18N.PGP_MIME_SIGN;
                    case STATUS.PGP_MIME | STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED:
                        return I18N.PGP_MIME_ENCRYPT_SIGN;
                    case STATUS.PM_EO | STATUS.ENCRYPTION_ENABLED:
                        return I18N.PM_EO;
                    case STATUS.PGP_INLINE | !STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED:
                        return I18N.PGP_INLINE_SIGN;
                    case STATUS.PGP_INLINE | STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED:
                        return I18N.PGP_INLINE_ENCRYPT_SIGN;
                    case STATUS.PINNING_ENABLED | STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED: // Internal Pm pinned
                        return I18N.PINNED_ENCRYPT_SIGN;
                    case STATUS.ENCRYPTION_ENABLED | STATUS.SIGNING_ENABLED: // Internal Pm
                        return I18N.PM_ENCRYPT_SIGN;
                    default:
                        return I18N.LOADING_CRYPT_INFO;
                }
            };

            const refreshTooltip = () => {
                const icon = el.find('.encryptionIcon');
                const title = getTooltip();
                tooltipModel.update(icon, { title });
            };

            on('composerInputRecipient', (event, { type, email }) => scope.$applyAsync(() => {
                if (type !== 'refresh' && email.Address !== scope.email.Address) {
                    return;
                }
                refreshTooltip();
            }));

            on('autocompleteEmails', (event, { type, messageID }) => scope.$applyAsync(() => {
                if (type !== 'refresh' && messageID !== scope.message.ID) {
                    return;
                }
                refreshTooltip();
            }));

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default autocompleteEmailsIcon;
