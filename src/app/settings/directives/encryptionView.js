import { PACKAGE_TYPE } from '../../constants';

/* @ngInject */
function encryptionView(gettextCatalog, mailSettingsModel, dispatchers, settingsMailApi, notification, networkActivityTracker) {

    const I18N = {
        SUCCES_MESSAGE: gettextCatalog.getString('Encryption setting updated', null, 'Info'),
        ERROR_MESSAGE: gettextCatalog.getString('Error while updating setting', null, 'Error')
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
            scope.pgpscheme = mailSettingsModel.get('PGPScheme') === PACKAGE_TYPE.SEND_PGP_INLINE ? 'pgp-inline' : 'pgp-mime';


            /**
             * Update the setting by Key:value
             * @param {String} key Name of the key to update and suffix of the function
             * @param {Boolean} value
             */
            const update = (key, value) => {
                const promise = settingsMailApi[`update${key}`]({ [key]: value })
                    .then(() => notification.success(I18N.SUCCES_MESSAGE))
                    .catch((error) => notification.error(error || I18N.ERROR_MESSAGE));
                networkActivityTracker.track(promise);
            };

            const onEvent = (key) => (e, { status }) => update(key, +!!status);

            // The event comes from the template -> toggle compomnent
            on('encryptSettings.attachPublic', onEvent('AttachPublicKey'));
            on('encryptSettings.sign', onEvent('Sign'));
            on('encryptSettings.promptpin', onEvent('PromptPin'));

            const updatePgpScheme = ({ target: { value = 'pgp-mime' } }) => {
                const state = value === 'pgp-mime' ? PACKAGE_TYPE.SEND_PGP_MIME : PACKAGE_TYPE.SEND_PGP_INLINE;
                update('PGPScheme', state);
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
