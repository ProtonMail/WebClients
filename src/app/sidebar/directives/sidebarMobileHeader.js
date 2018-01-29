/* @ngInject */
const sidebarMobileHeader = ($rootScope, authentication) => ({
    scope: {},
    replace: true,
    templateUrl: require('../../../templates/sidebar/sidebarMobileHeader.tpl.html'),
    link(scope) {
        const updateView = () => {
            const { Name = '', Addresses = [] } = authentication.user;
            const [{ DisplayName = '', Email = '' } = {}] = Addresses;

            scope.$applyAsync(() => {
                scope.displayName = DisplayName || Name;
                scope.email = Email;
            });
        };
        const unsubscribe = $rootScope.$on('updateUser', () => updateView());

        updateView();

        scope.$on('$destroy', () => {
            unsubscribe();
        });
    }
});
export default sidebarMobileHeader;
