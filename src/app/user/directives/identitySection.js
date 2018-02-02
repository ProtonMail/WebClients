import _ from 'lodash';

/* @ngInject */
function identitySection($rootScope, authentication, gettextCatalog, notification, signatureModel, tools) {
    const I18N = {
        SUCCESS_SAVE: gettextCatalog.getString('Default Name / Signature saved', null, "User's signature")
    };
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/identitySection.tpl.html'),
        link(scope, el) {
            const $form = el;
            const CACHE = {};
            const unsubscribe = [];
            const onSubmit = () => {
                const { DisplayName, Signature } = scope.address;
                signatureModel.save({ ID: CACHE.ID, DisplayName, Signature })
                    .then(() => notification.success(I18N.SUCCESS_SAVE));
            };
            const updateAddress = ({ ID, DisplayName, Signature }) => {
                CACHE.ID = ID;
                scope.$applyAsync(() => {
                    scope.address = { DisplayName, Signature: tools.replaceLineBreaks(Signature) };
                });
            };
            const updateUser = () => {
                const { Addresses = [] } = authentication.user || {};
                CACHE.addresses = Addresses.slice(0);
            };

            $form.on('submit', onSubmit);

            unsubscribe.push($rootScope.$on('changeAddressSelection', (event, { ID }) => {
                const address = _.find(CACHE.addresses, { ID });
                address && updateAddress(address);
            }));

            unsubscribe.push($rootScope.$on('updateUser', () => {
                updateUser();
            }));

            updateUser();
            updateAddress(CACHE.addresses[0]);

            scope.$on('$destroy', () => {
                $form.off('submit', onSubmit);
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}
export default identitySection;
