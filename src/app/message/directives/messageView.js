angular.module('proton.message')
.directive('messageView', ($stateParams, $state, $rootScope, conversationListeners, cache, hotkeys) => {

    function back() {
        const name = $state.$current.name;
        const route = name.replace('.element', '');
        $state.go(route, { id: '' }, { reload: true });
    }

    return {
        restrict: 'E',
        template: `
        <header id="conversationHeader">
            <h1 ng-bind="message.Subject"></h1>
        </header>
        <div id="pm_thread" tabindex="0">
            <message ng-if="message" data-model="message" data-last="true" data-index="0"></message>
        </div>
        `,
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

            scope.$on('$destroy', () => {
                hotkeys.bind(['down', 'up']);
                unsubscribeActions();
                unsubscribe();
            });
        }
    };
});
