/* @ngInject */
function keysView($rootScope, authentication) {
    const REQUIRE_CONTACT_CLASS = 'keysView-require-contact-keys-reactivation';
    const REQUIRE_ADDRESS_CLASS = 'keysView-require-address-keys-reactivation';
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/views/keysView.tpl.html'),
        link(scope, el) {
            const updateView = () => {
                const { Keys = [], Addresses = [] } = authentication.user;
                const contactAction = Keys.some(({ decrypted }) => !decrypted) ? 'add' : 'remove';
                const addressAction = Addresses.some(({ Keys = [] }) => Keys.filter(({ decrypted }) => !decrypted).length) ? 'add' : 'remove';

                el[0].classList[contactAction](REQUIRE_CONTACT_CLASS);
                el[0].classList[addressAction](REQUIRE_ADDRESS_CLASS);
            };
            const unsubscribe = $rootScope.$on('updateUser', updateView);
            updateView();
            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default keysView;
