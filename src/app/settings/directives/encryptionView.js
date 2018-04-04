/* @ngInject */
function encryptionView(gettextCatalog, mailSettingsModel, dispatchers, settingsMailApi, notification, networkActivityTracker, CONSTANTS) {
    const I18N = {
        SUCCES_MESSAGE: gettextCatalog.getString('Encryption setting updated'),
        ERROR_MESSAGE: gettextCatalog.getString('Error while updating setting')
    };
    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/settings/encryptionView.tpl.html'),
        link(scope, elem) {
            const pgpSelector = elem[0].querySelector('.pgp-scheme');
            scope.attachPublic = mailSettingsModel.get('AttachPublicKey');
            scope.sign = mailSettingsModel.get('Sign');
            scope.promptpin = mailSettingsModel.get('PromptPin');
            scope.pgpscheme = mailSettingsModel.get('PGPScheme') === CONSTANTS.PACKAGE_TYPE.SEND_PGP_INLINE ? 'pgp-inline' : 'pgp-mime';

            const { on, unsubscribe } = dispatchers();
            on('encryptSettings.attachPublic', (event, { status }) => {
                const promise = settingsMailApi
                    .updateAttachPublic({ AttachPublicKey: status ? 1 : 0 })
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                networkActivityTracker.track(promise);
            });
            on('encryptSettings.sign', (event, { status }) => {
                const promise = settingsMailApi
                    .updateSign({ Sign: status ? 1 : 0 })
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                networkActivityTracker.track(promise);
            });
            on('encryptSettings.promptpin', (event, { status }) => {
                const promise = settingsMailApi
                    .updatePromptPin({ PromptPin: status ? 1 : 0 })
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                networkActivityTracker.track(promise);
            });

            const updatePgpScheme = ({ target: { value = 'pgp-mime' } }) => {
                const promise = settingsMailApi
                    .updatePgpScheme({
                        PGPScheme: value === 'pgp-mime' ? CONSTANTS.PACKAGE_TYPE.SEND_PGP_MIME : CONSTANTS.PACKAGE_TYPE.SEND_PGP_INLINE
                    })
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                networkActivityTracker.track(promise);
            };
            pgpSelector.addEventListener('change', updatePgpScheme);

            scope.$on('$destroy', () => {
                pgpSelector.removeEventListener('change', updatePgpScheme);
                unsubscribe();
            });
        }
    };
}
export default encryptionView;
