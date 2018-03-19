/* @ngInject */
function messageView($stateParams, $state, dispatchers, $rootScope, conversationListeners, cache, hotkeys, CONSTANTS) {
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
            const { on, unsubscribe } = dispatchers();

            const messageID = $stateParams.id;
            let unsubscribeActions = angular.noop;

            cache.getMessage(messageID).then((message) => {
                scope.$applyAsync(() => {
                    message.openMe = true;
                    scope.message = message;
                    $rootScope.numberElementSelected = 1;

                    unsubscribeActions = conversationListeners(scope.message);
                    on('message.expiration', back);
                });

                hotkeys.unbind(['down', 'up']);
            });

            scope.$on('move', (e, mailbox) => {
                const labelID = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];

                /**
                 * Move item only when we didn't select anything
                 * -> Prevent x2 move with marked item by elementsCtrl
                 */
                if ($rootScope.numberElementChecked) {
                    return;
                }

                $rootScope.$emit('messageActions', {
                    type: 'move',
                    data: { ids: [scope.message.ID], labelID }
                });
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
