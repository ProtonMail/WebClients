/* @ngInject */
function SignaturesController(
    $rootScope,
    $scope,
    authentication,
    CONSTANTS,
    domainModel,
    memberModel,
    organizationModel,
    organizationKeysModel,
    addressModel,
    addressesModel,
    $state
) {
    const unsubscribes = [];
    const unsubscribesAll = [];

    $scope.isSubUser = authentication.user.subuser;
    const { active, disabled } = addressModel.getActive();
    $scope.activeAddresses = active;
    $scope.disabledAddresses = disabled;
    $scope.itemMoved = false;
    $scope.members = memberModel.getAll();

    $scope.organization = organizationModel.get();
    const isPaidAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;

    $scope.domains = domainModel.query();

    const refreshOrgKeys = async (orga = organizationModel.get()) => {
        await organizationKeysModel.manage(orga);

        $scope.$applyAsync(() => {
            $scope.keyStatus = organizationKeysModel.get('keyStatus');
            $scope.organizationKeyInfo = organizationKeysModel.get('organizationKeyInfo');
        });
    };

    const watcherAdmin = () => {
        unsubscribes.push(
            $rootScope.$on('organizationChange', (event, newOrganization) => {
                $scope.organization = newOrganization;
                organizationKeysModel.fetch().then(() => refreshOrgKeys(newOrganization));
            })
        );

        unsubscribes.push(
            $rootScope.$on('members', (e, { type, data = {} }) => {
                if (type === 'update') {
                    $scope.members = data.list;
                }
            })
        );

        unsubscribes.push(
            $rootScope.$on('domainsChange', (event, newDomains) => {
                $scope.domains = newDomains;
            })
        );
    };

    refreshOrgKeys();
    isPaidAdmin && watcherAdmin();

    // Clear previous listener if we revoke the admin
    unsubscribesAll.push(
        $rootScope.$on('updateUser', () => {
            if ($scope.itemMoved === false) {
                $scope.$applyAsync(() => {
                    const { active, disabled } = addressModel.getActive();
                    $scope.activeAddresses = active;
                    $scope.disabledAddresses = disabled;
                });
            }

            if (!isPaidAdmin && authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE) {
                memberModel.clear();
                organizationModel.clear();
                organizationKeysModel.clear();
                $state.reload();
            }

            $scope.$applyAsync(() => {
                $scope.members = memberModel.getAll();
            });
        })
    );

    unsubscribesAll.push(
        $rootScope.$on('addressModel', (e, { type }) => {
            if (type === 'generateKey.success') {
                $scope.$applyAsync(() => {
                    const { active, disabled } = addressModel.getActive();
                    $scope.activeAddresses = active;
                    $scope.disabledAddresses = disabled;
                });
            }
        })
    );

    // Drag and Drop configuration
    $scope.aliasDragControlListeners = {
        containment: '.pm_form',
        accept(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        dragStart() {
            $scope.itemMoved = true;
        },
        dragEnd() {
            $scope.itemMoved = false;
        },
        orderChanged() {
            const addresses = $scope.activeAddresses.concat($scope.disabledAddresses);
            const { active, disabled } = addressModel.getActive();
            const map = active.concat(disabled).reduce((acc, adr) => ((acc[adr.ID] = adr), acc), {});
            const newOrder = addresses.map(({ ID }) => map[ID].Order);

            addresses.forEach((address, index) => {
                address.Order = index + 1;
            });

            addressModel.saveOrder(newOrder);
        }
    };
    /**
     * Return domain value for a specific address
     * @param {Object} address
     * @return {String} domain
     */
    $scope.getDomain = (address) => {
        const [email] = address.Email.split('@');
        return email;
    };

    $scope.$on('$destroy', () => {
        unsubscribes.concat(unsubscribesAll).forEach((cb) => cb());
        unsubscribesAll.length = 0;
        unsubscribes.length = 0;
    });
}
export default SignaturesController;
