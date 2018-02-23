import { getAddressKeys, getUserKeys } from '../../address/helpers/addressKeysView';

/* @ngInject */
function keysView(dispatchers, authentication) {
    const REQUIRE_CONTACT_CLASS = 'keysView-require-contact-keys-reactivation';
    const REQUIRE_ADDRESS_CLASS = 'keysView-require-address-keys-reactivation';
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/views/keysView.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const updateView = ({ Keys = [], Addresses = [] }) => {
                const contactAction = Keys.some(({ decrypted }) => !decrypted) ? 'add' : 'remove';
                const addressAction = Addresses.some(({ Keys = [] }) => Keys.filter(({ decrypted }) => !decrypted).length) ? 'add' : 'remove';

                el[0].classList[contactAction](REQUIRE_CONTACT_CLASS);
                el[0].classList[addressAction](REQUIRE_ADDRESS_CLASS);
            };

            const update = () => {
                const user = authentication.user;

                scope.addressKeys = getAddressKeys(user.Addresses);
                scope.userKeys = getUserKeys(user);
                scope.isSubUser = user.subuser;

                updateView(user);
            };

            on('updateUser', update);
            update();

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}

export default keysView;
