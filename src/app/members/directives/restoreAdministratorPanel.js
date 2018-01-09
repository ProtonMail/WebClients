/* @ngInject */
function restoreAdministratorPanel(organizationKeysModel, organizationModel) {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/members/restoreAdministratorPanel.tpl.html'),
        link(scope, el) {
            const $btn = el.find('button');

            const onClick = () => organizationKeysModel.activateKeys(organizationModel.get());
            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
}
export default restoreAdministratorPanel;
