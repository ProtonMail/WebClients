/* @ngInject */
function organizationFormName(organizationModel) {
    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/organization/organizationFormName.tpl.html'),
        link(scope, el) {
            const { DisplayName } = organizationModel.get() || {};
            scope.value = DisplayName;

            const onSubmit = (e) => {
                e.preventDefault();
                scope.organizationForm.$valid && organizationModel.saveName(scope.value);
            };

            el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
            });
        }
    };
}
export default organizationFormName;
