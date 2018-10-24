import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function messageView($stateParams, $state, AppModel, dispatchers, conversationListeners, cache, hotkeys) {
    function back() {
        const name = $state.$current.name;
        const route = name.replace('.element', '');
        $state.go(route, { id: '' }, { reload: true });
    }

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/message/messageView.tpl.html'),
        link(scope) {
            const { dispatcher, on, unsubscribe } = dispatchers(['messageActions', 'elements']);

            const messageID = $stateParams.id;
            let unsubscribeActions = angular.noop;

            cache.getMessage(messageID).then((message) => {
                dispatcher.elements('mark', { id: messageID });
                dispatcher.elements('opened', { id: messageID });

                scope.$applyAsync(() => {
                    message.openMe = true;
                    scope.message = message;
                    AppModel.set('numberElementSelected', 1);

                    unsubscribeActions = conversationListeners(scope.message);
                    on('message.expiration', back);
                });

                hotkeys.unbind(['down', 'up']);
            });

            on('hotkeys', (e, { type, data: { to } }) => {
                if (type === 'move') {
                    const labelID = MAILBOX_IDENTIFIERS[to];

                    /**
                     * Move item only when we didn't select anything
                     * -> Prevent x2 move with marked item by elementsCtrl
                     */
                    if (AppModel.get('numberElementChecked')) {
                        return;
                    }

                    dispatcher.messageActions('move', { ids: [scope.message.ID], labelID });
                }
            });

            scope.$on('$destroy', () => {
                hotkeys.bind(['down', 'up']);
                unsubscribeActions();
                unsubscribe();
            });
        }
    };
}
export default messageView;
