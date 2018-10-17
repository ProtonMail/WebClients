import { isOwnAddress } from '../../../helpers/address';

/* @ngInject */
function advancedSettingsBtn(contactEncryptionSettings, addressesModel, keyCache) {
    return {
        scope: {
            contact: '=',
            model: '=',
            mode: '=',
            form: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/advancedSettingsBtn.tpl.html'),
        link(scope, el) {
            scope.isOwnAddress = (email) => {
                const address = addressesModel.getByEmail(email);
                const keys = keyCache.getUserAddressesKeys(address) || {};
                return isOwnAddress(address, keys);
            };

            const onClick = async () => {
                try {
                    await contactEncryptionSettings({ ...scope.model }, scope.contact, {
                        mode: scope.mode,
                        form: scope.form
                    });
                } catch (e) {
                    // noop
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default advancedSettingsBtn;
