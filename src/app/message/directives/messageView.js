angular.module('proton.message')
    .directive('messageView', ($stateParams, $state, $rootScope, conversationListeners, cache, hotkeys, CONSTANTS) => {

        function back() {
            const name = $state.$current.name;
            const route = name.replace('.element', '');
            $state.go(route, { id: '' }, { reload: true });
        }

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/message/messageView.tpl.html',
            link(scope) {
                const messageID = $stateParams.id;
                let unsubscribeActions = angular.noop;
                let unsubscribe = angular.noop;

                cache.getMessage(messageID)
                    .then((message) => {
                        scope.$applyAsync(() => {
                            message.openMe = true;
                            scope.message = message;
                            $rootScope.numberElementSelected = 1;

                            unsubscribeActions = conversationListeners(scope.message);
                            unsubscribe = $rootScope.$on('message.expiration', () => back());
                        });

                        hotkeys.unbind(['down', 'up']);
                    });

                scope.$on('move', (e, mailbox) => {
                    const labelID = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
                    $rootScope.$emit('messageActions', {
                        action: 'move',
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
    });
