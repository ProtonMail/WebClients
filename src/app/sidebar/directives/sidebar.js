/* @ngInject */
const sidebar = (sidebarModel) => ({
    scope: {},
    replace: true,
    templateUrl: require('../../../templates/partials/sidebar.tpl.html'),
    link(scope) {
        scope.listStates = Object.keys(sidebarModel.getStateConfig());
        scope.scrollbarConfig = {
            scrollInertia: 0
        };
    }
});
export default sidebar;
