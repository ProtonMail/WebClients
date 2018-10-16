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
        ENABLE_SIGNING_TITLE: gettextCatalog.getString(
            'Automatic sign outgoing messages?',
            null,
            'Confirm modal title'
        ),
        ENABLE_SIGNING_MESSAGE: gettextCatalog.getString(
            'PGP clients are more likely to automatically detect your PGP keys if outgoing messages are signed.',
            null,
            'Info'
        ),
        YES: gettextCatalog.getString('Yes', null, 'Confirm text'),
        NO: gettextCatalog.getString('No', null, 'Confirm text')
    };

    const askSign = async (status) => {
        if (!status || mailSettingsModel.get('Sign')) {
            return false;
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

    const request = (promise) => {
        return promise.then(() => notification.success(I18N.SUCCES_MESSAGE));
    };

    const updatePgpScheme = ({ target: { value = 'pgp-mime' } }) => {
        const PGPScheme = value === 'pgp-mime' ? PACKAGE_TYPE.SEND_PGP_MIME : PACKAGE_TYPE.SEND_PGP_INLINE;
        request(settingsMailApi.updatePgpScheme({ PGPScheme }));
    };

    const attachPublicKey = async (status, scope) => {
        const enableSign = await askSign(status);

        const promises = [settingsMailApi.updateAttachPublic({ AttachPublicKey: +status })];

        if (enableSign) {
            const promise = settingsMailApi.updateSign({ Sign: 1 }).then(() => {
                scope.$applyAsync(() => {
                    scope.sign = true;
                });
            });
            promises.push(promise);
        }
        request(Promise.all(promises));
    };

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/settings/encryptionView.tpl.html'),
        link(scope, elem) {
            const { on, unsubscribe } = dispatchers();
            const pgpSelector = elem[0].querySelector('.pgp-scheme');

            scope.attachPublic = mailSettingsModel.get('AttachPublicKey');
            scope.sign = mailSettingsModel.get('Sign');
            scope.promptpin = mailSettingsModel.get('PromptPin');
            scope.pgpscheme =
                mailSettingsModel.get('PGPScheme') === PACKAGE_TYPE.SEND_PGP_INLINE ? 'pgp-inline' : 'pgp-mime';

            on('encryptSettings', (e, { type, data: { status } }) => {
                type === 'attachPublic' && attachPublicKey(status, scope);

                if (type === 'sign') {
                    request(settingsMailApi.updateSign({ Sign: +status }));
                }
                if (type === 'promptpin') {
                    request(settingsMailApi.updatePromptPin({ PromptPin: +status }));
                }
            });

            pgpSelector.addEventListener('change', updatePgpScheme);

            scope.$on('$destroy', () => {
                pgpSelector.removeEventListener('change', updatePgpScheme);
                unsubscribe();
            });
        }
    };
}
export default encryptionView;
