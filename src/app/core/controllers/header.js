import { WIZARD_ENABLED } from '../../constants';

/* @ngInject */
function HeaderController($rootScope, $scope, $state, authentication, organizationModel, userType) {
    const unsubscribes = [];

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

    unsubscribes.push(
        $rootScope.$on('organizationChange', (event, newOrganization) => {
            $scope.organization = newOrganization;
        })
    );

    unsubscribes.push($rootScope.$on('updateUser', setUserType));

    $scope.$on('$destroy', () => {
        unsubscribes.forEach((cb) => cb());
        unsubscribes.length = 0;
    });

    $scope.cancel = () => {
        if (angular.isDefined($scope.params.cancel) && angular.isFunction($scope.params.cancel)) {
            $scope.params.cancel();
        }
    };

    $scope.activeSettings = () => {
        const route = $state.$current.name.replace('secured.', '');
        const settings = [
            'dashboard',
            'account',
            'labels',
            'filters',
            'security',
            'appearance',
            'domains',
            'bridge',
            'pmme',
            'signatures',
            'members',
            'payments',
            'keys',
            'vpn'
        ];

        return settings.indexOf(route) !== -1;
    };
}
export default HeaderController;
