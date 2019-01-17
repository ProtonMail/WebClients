import { PAID_ADMIN_ROLE } from '../../constants';
import { describe } from '../../../helpers/keyAlgorithm';

/* @ngInject */
function SignaturesController(
    dispatchers,
    $scope,
    authentication,
    domainModel,
    memberModel,
    organizationModel,
    organizationKeysModel,
    addressModel,
    addressesModel,
    $state
) {
    const { on, unsubscribe } = dispatchers();

    $scope.isSubUser = authentication.user.subuser;
    const { active, disabled } = addressesModel.getActive();
    $scope.activeAddresses = active;
    $scope.disabledAddresses = disabled;
    $scope.itemMoved = false;
    $scope.members = memberModel.getAll();

    $scope.organization = organizationModel.get();
    const isPaidAdmin = authentication.user.Role === PAID_ADMIN_ROLE;

    $scope.domains = domainModel.query();

    const refreshOrgKeys = async (orga = organizationModel.get()) => {
        await organizationKeysModel.manage(orga);

        $scope.$applyAsync(() => {
            $scope.keyStatus = organizationKeysModel.get('keyStatus');
            $scope.organizationKeyInfo = organizationKeysModel.get('organizationKeyInfo');
            $scope.organizationKeyType = describe($scope.organizationKeyInfo);
        });
    };

    const watcherAdmin = () => {
        on('organizationChange', (event, { data: newOrganization }) => {
            $scope.organization = newOrganization;
            organizationKeysModel.fetch().then(() => refreshOrgKeys(newOrganization));
        });

        on('members', (e, { type, data = {} }) => {
            if (type === 'update') {
                $scope.members = data.list;
            }
        });

        on('domainsChange', (e, { data: newDomains }) => {
            $scope.$applyAsync(() => {
                $scope.domains = newDomains;
            });
        });
    };

    refreshOrgKeys();
    isPaidAdmin && watcherAdmin();

    // Clear previous listener if we revoke the admin
    on('updateUser', () => {
        if ($scope.itemMoved === false) {
            $scope.$applyAsync(() => {
                const { active, disabled } = addressesModel.getActive();
                $scope.activeAddresses = active;
                $scope.disabledAddresses = disabled;
            });
        }

        if (!isPaidAdmin && authentication.user.Role === PAID_ADMIN_ROLE) {
            memberModel.clear();
            organizationModel.clear();
            organizationKeysModel.clear();
            $state.reload();
        }

        $scope.$applyAsync(() => {
            $scope.members = memberModel.getAll();
        });
    });

    on('addressModel', (e, { type }) => {
        if (type === 'generateKey.success') {
            $scope.$applyAsync(() => {
                const { active, disabled } = addressesModel.getActive();
                $scope.activeAddresses = active;
                $scope.disabledAddresses = disabled;
            });
        }
    });

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
            const newOrder = addresses.map(({ ID }) => ID);

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

    $scope.$on('$destroy', unsubscribe);
}
export default SignaturesController;
