angular.module('proton.members')
.directive('restoreAdministratorPanel', () => {
    return {
        restrict: 'E',
        templateUrl: 'templates/members/restoreAdministratorPanel.tpl.html',
        link(scope) {
            scope.restore = () => {
                scope.activateOrganizationKeys();
            };
        }
    };
});
