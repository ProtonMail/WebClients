/* @ngInject */
const sidebarMobile = (sidebarModel, $rootScope, authentication, AppModel, userType) => ({
    replace: true,
    scope: {},
    templateUrl: require('../../../templates/partials/sidebar-responsive.tpl.html'),
    link(scope) {
        const unsubscribes = [];
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

        unsubscribes.push(
            $rootScope.$on('$stateChangeStart', () => {
                AppModel.set('showSidebar', false);
            })
        );

        unsubscribes.push($rootScope.$on('updateUser', setUserType));

        scope.$on('$destroy', () => {
            unsubscribes.forEach((cb) => cb());
            unsubscribes.length = 0;
        });
    }
});
export default sidebarMobile;
