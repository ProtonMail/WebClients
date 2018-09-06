import { PACKAGE_TYPE } from '../../constants';

/* @ngInject */
function encryptionView(
    gettextCatalog,
    mailSettingsModel,
    dispatchers,
    settingsMailApi,
    notification,
    networkActivityTracker,
    confirmModal
) {
    const I18N = {
        SUCCES_MESSAGE: gettextCatalog.getString('Encryption setting updated', null, 'Success'),
        ERROR_MESSAGE: gettextCatalog.getString('Error while updating setting', null, 'Error'),
        ENABLE_SIGNING_TITLE: gettextCatalog.getString(
            'Automatic sign outgoing messages?',
            null,
            'Confirm modal title'
        ),
        ENABLE_SIGNING_MESSAGE: gettextCatalog.getString(
            'PGP clients are more likely to automatically detect your PGP keys if outgoing messages are signed.'
        ),
        YES: gettextCatalog.getString('Yes', null, 'Confirm text'),
        NO: gettextCatalog.getString('No', null, 'Confirm text')
    };
    const askSign = (status) => {
        if (!status || mailSettingsModel.get('Sign')) {
            return Promise.resolve(false);
        }
        return new Promise((resolve) => {
            confirmModal.activate({
                params: {
                    title: I18N.ENABLE_SIGNING_TITLE,
                    message: I18N.ENABLE_SIGNING_MESSAGE,
                    confirmText: I18N.YES,
                    cancelText: I18N.NO,
                    confirm() {
                        resolve(true);
                        confirmModal.deactivate();
                    },
                    cancel() {
                        resolve(false);
                        confirmModal.deactivate();
                    }
                }
            });
        });
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
            scope.pgpscheme =
                mailSettingsModel.get('PGPScheme') === PACKAGE_TYPE.SEND_PGP_INLINE ? 'pgp-inline' : 'pgp-mime';

            const { on, unsubscribe } = dispatchers();
            on('encryptSettings.attachPublic', (event, { data: { status } }) => {
                askSign(status).then((enableSign) => {
                    const promises = [settingsMailApi.updateAttachPublic({ AttachPublicKey: +status })];
                    if (enableSign) {
                        promises.push(settingsMailApi.updateSign({ Sign: 1 }).then(() => (scope.sign = 1)));
                    }
                    const promise = Promise.all(promises)
                        .then(() => notification.success(I18N.SUCCES_MESSAGE))
                        .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                    networkActivityTracker.track(promise);
                });
            });
            on('encryptSettings.sign', (event, { data: { status } }) => {
                const promise = settingsMailApi
                    .updateSign({ Sign: +status })
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                networkActivityTracker.track(promise);
            });
            on('encryptSettings.promptpin', (event, { data: { status } }) => {
                const promise = settingsMailApi
                    .updatePromptPin({ PromptPin: +status })
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                networkActivityTracker.track(promise);
            });

            const updatePgpScheme = ({ target: { value = 'pgp-mime' } }) => {
                const promise = settingsMailApi
                    .updatePgpScheme({
                        PGPScheme: value === 'pgp-mime' ? PACKAGE_TYPE.SEND_PGP_MIME : PACKAGE_TYPE.SEND_PGP_INLINE
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
