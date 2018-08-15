/* @ngInject */
const conversationPlaceholder = (AppModel, dispatchers) => ({
    replace: true,
    templateUrl: require('../../../templates/partials/conversation-placeholder.tpl.html'),
    link(scope) {
        const { on, unsubscribe } = dispatchers();
        const update = (value = false) => (scope.showWelcome = value);

        on('AppModel', (event, { type, data = {} }) => {
            if (type === 'showWelcome') {
                scope.$applyAsync(() => {
                    update(data.value);
                });
            }
        });

        update(AppModel.get('showWelcome'));

        scope.$on('$destroy', () => {
            unsubscribe();
        });
    }
});
export default conversationPlaceholder;
