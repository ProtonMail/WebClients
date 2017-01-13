angular.module('proton.ui')
.directive('headerView', (organizationModel, $rootScope) => {
    return {
        restrict: 'E',
        templateUrl: 'templates/ui/headerView.tpl.html',
        scope: {},
        link(scope) {
            const unsubscribes = [];
            scope.organization = organizationModel.get();
            unsubscribes.push($rootScope.$on('organizationChange', (event, newOrganization) => {
                scope.organization = newOrganization;
            }));
            scope.$on('$destroy', () => {
                unsubscribes.forEach((callback) => callback());
            });
        }
    };
});
