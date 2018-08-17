/* @ngInject */
const conversationPlaceholder = (AppModel, authentication, dispatchers) => ({
    replace: true,
    templateUrl: require('../../../templates/partials/conversation-placeholder.tpl.html'),
    link(scope) {
        const { on, unsubscribe } = dispatchers();
        const updateWelcome = (value = false) => (scope.showWelcome = value);
        const updateUser = () => (scope.user = angular.copy(authentication.user));

        on('AppModel', (event, { type, data = {} }) => {
            if (type === 'showWelcome') {
                scope.$applyAsync(() => {
                    updateWelcome(data.value);
                });
            }
        });

        on('updateUser', () => {
            scope.$applyAsync(() => {
                updateUser();
            });
        });

        updateWelcome(AppModel.get('showWelcome'));
        updateUser();

        scope.$on('$destroy', () => {
            unsubscribe();
        });
    }
});
export default conversationPlaceholder;
