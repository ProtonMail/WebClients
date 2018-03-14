
/* @ngInject */
function addressesSection(addressModel, addressesModel, dispatchers, userType) {

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/addressesSection.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers(['addressModel', 'updateUser']);
            const updateAddresses = () => {
                scope.$applyAsync(() => {
                    const { active, disabled } = addressModel.getActive();

                    scope.activeAddresses = active;
                    scope.disabledAddresses = disabled;
                });
            };
            const updateUserType = () => {
                scope.$applyAsync(() => {
                    const { isAdmin, isFree } = userType();

                    scope.isAdmin = isAdmin;
                    scope.isFree = isFree;
                });
            };

            scope.itemMoved = false;
            scope.getDomain = ({ Email = '' } = {}) => {
                const [email] = Email.split('@');
                return email;
            };
            scope.aliasDragControlListeners = {
                containment: '.pm_form',
                accept(sourceItemHandleScope, destSortableScope) {
                    return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                },
                dragStart() {
                    scope.itemMoved = true;
                },
                dragEnd() {
                    scope.itemMoved = false;
                },
                orderChanged() {
                    const addresses = scope.activeAddresses.concat(scope.disabledAddresses);
                    const { active, disabled } = addressModel.getActive();
                    const map = active.concat(disabled).reduce((acc, adr) => ((acc[adr.ID] = adr), acc), {});
                    const newOrder = addresses.map(({ ID }) => map[ID].Order);

                    addresses.forEach((address, index) => {
                        address.Order = index + 1;
                    });

                    addressModel.saveOrder(newOrder);
                }
            };

            on('updateUser', () => {
                if (!scope.itemMoved) {
                    updateAddresses();
                }
                updateUserType();
            });

            on('addressModel', (e, { type }) => {
                if (type === 'generateKey.success') {
                    updateAddresses();
                }
            });

            updateAddresses();
            updateUserType();

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default addressesSection;
