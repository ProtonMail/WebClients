/* @ngInject */
const sidebarMobile = (sidebarModel, dispatchers, authentication, AppModel, userType) => ({
    replace: true,
    scope: {},
    templateUrl: require('../../../templates/partials/sidebar-responsive.tpl.html'),
    link(scope) {
        const { on, unsubscribe } = dispatchers();

        const setUserType = () => {
            const { isAdmin, isFree } = userType();
            scope.isAdmin = isAdmin;
            scope.isFree = isFree;
        };
        setUserType();
        scope.listStates = Object.keys(sidebarModel.getStateConfig());

        // Hide the sidebar with a delay for better perf on repaint
        scope.hideMobileSidebar = () => {
            const id = setTimeout(() => {
                AppModel.set('showSidebar', false);
                clearTimeout(id);
            }, 1000);
        };

        on('$stateChangeStart', () => {
            AppModel.set('showSidebar', false);
        });

        on('updateUser', setUserType);

        scope.$on('$destroy', unsubscribe);
    }
});
export default sidebarMobile;
