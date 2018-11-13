/* @ngInject */
function organizationFormName(dispatchers, organizationModel) {
    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/organization/organizationFormName.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const { DisplayName = '' } = organizationModel.get() || {};
            const updateName = (organizationName = '') => (scope.value = organizationName);

            const onSubmit = (e) => {
                e.preventDefault();
                scope.organizationForm.$valid && organizationModel.saveName(scope.value);
            };

            on('organizationChange', (event, { data: newOrganization }) => {
                scope.$applyAsync(() => {
                    updateName(newOrganization.DisplayName);
                });
            });

            el.on('submit', onSubmit);

            updateName(DisplayName);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
                unsubscribe();
            });
        }
    };
}
export default organizationFormName;
