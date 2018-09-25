import { syncObjectList } from '../../../helpers/arrayHelper';

/* @ngInject */
function keysView(dispatchers, addressKeysViewModel, addressesModel, authentication, reactivateKeys) {
    const REQUIRE_CLASS = 'keysView-require-keys-reactivation';

    const requireKeysReactivation = () => {
        const keys = reactivateKeys.get();
        return keys.length;
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/views/keysView.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const updateClass = () => {
                const action = requireKeysReactivation() ? 'add' : 'remove';
                el[0].classList[action](REQUIRE_CLASS);
            };

            const updateUser = async () => {
                const user = authentication.user;
                const userKeys = await addressKeysViewModel.getUserKeys(user);

                scope.$applyAsync(() => {
                    scope.isSubUser = user.subuser;
                    scope.userKeys = userKeys;
                    updateClass();
                });
            };

            const updateAddresses = (addresses = addressesModel.get()) => {
                const addressKeys = addressKeysViewModel.getAddressKeys(addresses);

                scope.$applyAsync(() => {
                    // syncObjectList to prevent a total redraw, which closes the keys tables
                    scope.addressKeys = syncObjectList('addressID', scope.addressKeys, addressKeys);
                    updateClass();
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
