/* @ngInject */
const conversationPlaceholder = (AppModel, authentication, dispatchers, sidebarModel) => ({
    replace: true,
    templateUrl: require('../../../templates/partials/conversation-placeholder.tpl.html'),
    link(scope, el) {
        const { on, unsubscribe, dispatcher } = dispatchers(['bugReport']);
        const updateWelcome = (value = false) => (scope.showWelcome = value);
        const updateUser = () => (scope.user = angular.copy(authentication.user));

        scope.welcomeModel = {
            unread: sidebarModel.unread('inbox')
        };

        const updateCounter = () => {
            scope.$applyAsync(() => {
                scope.welcomeModel.unread = sidebarModel.unread('inbox');
            });
        };

        // Update the counter when we load then
        on('app.cacheCounters', (e, { type }) => {
            type === 'load' && updateCounter();
        });
        // Update the counter when we update it (too many updates if we update them via app.cacheCounters)
        on('elements', (e, { type }) => {
            type === 'refresh' && updateCounter();
        });

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

        const onClick = ({ target }) => {
            if (target.getAttribute('data-click-action') === 'bugReport') {
                dispatcher.bugReport('new');
            }
        };

        updateWelcome(AppModel.get('showWelcome'));
        updateUser();

        el.on('click', onClick);
        scope.$on('$destroy', () => {
            el.off('click', onClick);
            unsubscribe();
        });
    }
});
export default conversationPlaceholder;
