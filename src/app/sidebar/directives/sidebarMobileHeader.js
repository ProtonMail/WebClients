/* @ngInject */
const sidebarMobileHeader = (dispatchers, addressesModel, authentication) => ({
    scope: {},
    replace: true,
    templateUrl: require('../../../templates/sidebar/sidebarMobileHeader.tpl.html'),
    link(scope) {
        const { on, unsubscribe } = dispatchers();

        const updateView = () => {
            const { Name = '' } = authentication.user;
            const [{ DisplayName = '', Email = '' } = {}] = addressesModel.get() || [];

            scope.$applyAsync(() => {
                scope.displayName = DisplayName || Name;
                scope.email = Email;
            });
        };
        on('updateUser', () => updateView());

        updateView();

        scope.$on('$destroy', unsubscribe);
    }
});
export default sidebarMobileHeader;
