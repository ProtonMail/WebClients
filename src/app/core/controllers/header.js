angular.module('proton.core')
.controller('HeaderController', ($rootScope, $scope, $state, authentication, organizationModel, CONSTANTS) => {

    $scope.params = {};
    $scope.user = authentication.user;
    $scope.organization = organizationModel.get();
    $scope.wizardEnabled = CONSTANTS.WIZARD_ENABLED;
    $scope.ctrl = {};
    $scope.starred = 2;

    const unsubscribe = $rootScope.$on('organizationChange', (event, newOrganization) => {
        $scope.organization = newOrganization;
    });
    $scope.$on('$destroy', () => unsubscribe());


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
        const settings = ['account', 'labels', 'security', 'appearance', 'domains', 'addresses', 'users', 'payments', 'keys'];

        return settings.indexOf(route) !== -1;
    };

});
