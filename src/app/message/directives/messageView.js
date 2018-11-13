import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function messageView(
    $stateParams,
    $state,
    dispatchers,
    AppModel,
    conversationListeners,
    cache,
    hotkeys,
    recipientsFormator
) {
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
                const { ToList, CCList, BCCList } = recipientsFormator.list(message);
                scope.$applyAsync(() => {
                    message.openMe = true;

                    message.ToList = ToList;
                    message.CCList = CCList;
                    message.BCCList = BCCList;
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
