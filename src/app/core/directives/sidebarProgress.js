angular.module('proton.core')
    .directive('sidebarProgress', (authentication, organizationModel, $filter, $rootScope) => {
        const filter = $filter('humanSize');
        const percentage = $filter('percentage');
        const percentageValue = () => percentage(authentication.user.UsedSpace, authentication.user.MaxSpace);
        const organization = organizationModel.get();

        return {
            templateUrl: 'templates/directives/core/sidebarProgress.tpl.html',
            replace: true,
            link(scope) {
                scope.notVisionary = organization.PlanName !== 'visionary';
                scope.storageStyle = () => ({ width: `${percentageValue()}%` });
                scope.storageValue = () => `${filter(authentication.user.UsedSpace)} / ${filter(authentication.user.MaxSpace)}`;
                const unsubscribe = $rootScope.$on('organizationChange', (event, newOrganization) => {
                    scope.notVisionary = newOrganization.PlanName !== 'visionary';
                });
                scope.$on('$destroy', () => {
                    unsubscribe();
                });
            }
        };
    });
