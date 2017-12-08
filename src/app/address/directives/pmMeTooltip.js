/* @ngInject */
function pmMeTooltip(AppModel, authentication, gettextCatalog, tooltipModel) {
    return {
        restrict: 'A',
        link(scope, element) {
            if (!AppModel.is('mobile')) {
                const title = gettextCatalog.getString(
                    'This will add the {{name}}@pm.me address to your account',
                    { name: authentication.user.Name },
                    'Info'
                );
                tooltipModel.add(element, { title });
            }
        }
    };
}
export default pmMeTooltip;
