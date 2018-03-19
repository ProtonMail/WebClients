/* @ngInject */
function hideUpgrade(dispatchers, organizationModel) {
    const HIDE_UPGRADE_CLASS = 'hideUpgrade';
    return {
        restrict: 'A',
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            // NOTE the type is defined inside hide-upgrade attribute
            on('organizationChange', (event, { data: newOrganization }) => update(newOrganization));

            function update({ PlanName }) {
                if (PlanName === 'visionary') {
                    return element[0].classList.add(HIDE_UPGRADE_CLASS);
                }
                return element[0].classList.remove(HIDE_UPGRADE_CLASS);
            }

            update(organizationModel.get());

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default hideUpgrade;
