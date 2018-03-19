/* @ngInject */
function navigationUser(dispatchers, addressesModel, authentication) {
    return {
        replace: true,
        templateUrl: require('../../../../templates/ui/navigation/navigationUser.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            const updateView = () => {
                const { Name = '' } = authentication.user;
                const [{ DisplayName = '', Email = '' } = {}] = addressesModel.get();

                scope.$applyAsync(() => {
                    scope.displayName = DisplayName || Name;
                    scope.email = Email;
                });
            };

            on('updateUser', updateView);
            updateView();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default navigationUser;
