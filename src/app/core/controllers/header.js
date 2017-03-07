angular.module('proton.core')
.controller('HeaderController', ($rootScope, $scope, $state, authentication, organizationModel, CONSTANTS) => {
    const unsubscribes = [];

    $scope.params = {};
    $scope.user = authentication.user;
    $scope.organization = organizationModel.get();
    $scope.wizardEnabled = CONSTANTS.WIZARD_ENABLED;
    $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
    $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
    $scope.ctrl = {};
    $scope.starred = 2;

    unsubscribes.push($rootScope.$on('organizationChange', (event, newOrganization) => {
        $scope.organization = newOrganization;
    }));

    unsubscribes.push($rootScope.$on('updateUser', () => {
        $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
        $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER_ROLE;
    }));

    $scope.$on('$destroy', () => {
        unsubscribes.forEach((cb) => cb());
        unsubscribes.length = 0;
    });

    // $scope.toggleAdvancedSearch = () => {
    //     if ($scope.advancedSearch === false) {
    //         $scope.openSearchModal();
    //     } else {
    //         $scope.closeSearchModal();
    //     }
    // };

    $scope.cancel = () => {
        if (angular.isDefined($scope.params.cancel) && angular.isFunction($scope.params.cancel)) {
            $scope.params.cancel();
        }
    };

    $scope.activeSettings = () => {
        const route = $state.$current.name.replace('secured.', '');
        const settings = ['account', 'labels', 'security', 'appearance', 'domains', 'identities', 'users', 'payments', 'keys'];

        return settings.indexOf(route) !== -1;
    };

});
