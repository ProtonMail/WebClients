angular.module('proton.core')
.directive('hideUpgrade', (organizationModel, $rootScope) => {
    return {
        restrict: 'A',
        link(scope, element) {
            const organization = organizationModel.get();
            const unsubscribe = $rootScope.$on('organizationChange', (event, newOrganization) => update(newOrganization));

            scope.$on('$destroy', () => unsubscribe());
            update(organization);

            function update(organization) {
                const isVisionary = organization.PlanName === 'visionary';

                if (isVisionary) {
                    element[0].style.display = 'none';
                } else {
                    element[0].style.display = 'block';
                }
            }
        }
    };
});
