/* @ngInject */
const sidebar = (sidebarModel) => ({
    scope: {},
    replace: true,
    templateUrl: require('../../../templates/partials/sidebar.tpl.html'),
    link(scope) {
        scope.listStates = Object.keys(sidebarModel.getStateConfig());
    }
});
export default sidebar;
