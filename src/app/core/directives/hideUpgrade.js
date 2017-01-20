angular.module('proton.core')
.directive('hideUpgrade', (organizationModel, $rootScope) => {
    const HIDE_UPGRADE_CLASS = 'hideUpgrade';
    return {
        restrict: 'A',
        link(scope, element) {
            // NOTE the type is defined inside hide-upgrade attribute
            const unsubscribe = $rootScope.$on('organizationChange', (event, newOrganization) => update(newOrganization));

            function update({ PlanName }) {
                if (PlanName === 'visionary') {
                    return element[0].classList.add(HIDE_UPGRADE_CLASS);
                }
                return element[0].classList.remove(HIDE_UPGRADE_CLASS);
            }

            update(organizationModel.get());

            scope.$on('$destroy', () => unsubscribe());
        }
    };
});
