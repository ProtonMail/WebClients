/* @ngInject */
function keysView(dispatchers, addressKeysViewModel, addressesModel, authentication) {
    const REQUIRE_CONTACT_CLASS = 'keysView-require-contact-keys-reactivation';
    const REQUIRE_ADDRESS_CLASS = 'keysView-require-address-keys-reactivation';
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/views/keysView.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const updateUser = async () => {
                const user = authentication.user;
                const contactAction = user.Keys.some(({ decrypted }) => !decrypted) ? 'add' : 'remove';
                const userKeys = await addressKeysViewModel.getUserKeys(user);

                scope.$applyAsync(async () => {
                    scope.isSubUser = user.subuser;
                    scope.userKeys = userKeys;
                    el[0].classList[contactAction](REQUIRE_CONTACT_CLASS);
                });
            };

            const updateAddresses = (addresses = addressesModel.get()) => {
                const addressAction = addresses.some(
                    ({ Keys = [] }) => Keys.filter(({ decrypted }) => !decrypted).length
                )
                    ? 'add'
                    : 'remove';

                scope.$applyAsync(() => {
                    scope.addressKeys = addressKeysViewModel.getAddressKeys(addresses);
                    el[0].classList[addressAction](REQUIRE_ADDRESS_CLASS);
                });
            };

            on('updateUser', () => {
                updateUser();
            });

            on('addressesModel', (e, { type = '', data = {} }) => {
                if (type === 'addresses.updated') {
                    updateAddresses(data.addresses);
                }
            });

            updateAddresses();
            updateUser();

            scope.$on('$destroy', unsubscribe);
        }
    };
}

export default keysView;
