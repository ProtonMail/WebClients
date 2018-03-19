import { WIZARD_ENABLED } from '../../constants';

/* @ngInject */
function HeaderController($scope, $state, authentication, dispatchers, organizationModel, userType) {
    const { on, unsubscribe } = dispatchers();

    const setUserType = () => {
        const { isAdmin, isFree } = userType();
        $scope.isAdmin = isAdmin;
        $scope.isFree = isFree;
    };
    setUserType();
    $scope.params = {};
    $scope.user = authentication.user;
    $scope.organization = organizationModel.get();
    $scope.wizardEnabled = WIZARD_ENABLED;
    $scope.ctrl = {};
    $scope.starred = 2;

    on('organizationChange', (event, { data: newOrganization }) => {
        $scope.organization = newOrganization;
    });

    on('updateUser', setUserType);

    $scope.$on('$destroy', () => {
        unsubscribe();
    });

    $scope.cancel = () => {
        if (angular.isDefined($scope.params.cancel) && angular.isFunction($scope.params.cancel)) {
            $scope.params.cancel();
        }
    };

    $scope.activeSettings = () => {
        const currentRoute = $state.$current.name;
        const settings = [
            'secured.dashboard',
            'secured.account',
            'secured.labels',
            'secured.filters',
            'secured.autoresponder',
            'secured.security',
            'secured.appearance',
            'secured.domains',
            'secured.bridge',
            'secured.pmme',
            'secured.members',
            'secured.payments',
            'secured.keys',
            'secured.vpn'
        ];

        return settings.indexOf(currentRoute) !== -1;
    };
}
export default HeaderController;
