import { isOwnAddress } from '../../../helpers/address';

/* @ngInject */
function advancedSettingsBtn(contactEncryptionSettings, addressesModel, keyCache, dispatchers) {
    return {
        scope: {
            contact: '=',
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/advancedSettingsBtn.tpl.html'),
        link(scope, el) {
            const { dispatcher } = dispatchers(['contacts']);

            scope.isOwnAddress = (email) => {
                const address = addressesModel.getByEmail(email);
                const keys = keyCache.getUserAddressesKeys(address) || {};
                return isOwnAddress(address, keys);
            };

            const onClick = async () => {
                try {
                    const data = await contactEncryptionSettings({ ...scope.model }, scope.contact);

                    data.vCard &&
                        dispatcher.contacts('advancedSettings.set', {
                            contact: scope.contact,
                            vCard: data.vCard
                        });

                    // Ensure we sync the view -> when we create a contact only
                    scope.$applyAsync(() => {
                        data.vCard && (scope.contact.vCard = data.vCard);
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
