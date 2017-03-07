angular.module('proton.conversation')
.directive('conversationView', ($state, $stateParams, cache, tools) => ({
    restrict: 'E',
    replace: true,
    template: '<div class="conversationView-container"><conversation ng-if="conversation" data-conversation="conversation"></conversation></div>',
    link(scope) {
        const conversationID = $stateParams.id;
        const loc = tools.currentLocation();

        function back() {
            const route = $state.$current.name.replace('.element', '');
            $state.go(route, { id: null });
        }

        cache.getConversation(conversationID)
            .then((conversation) => {
                if (conversation.LabelIDs.indexOf(loc) > -1 || $state.includes('secured.search.**')) {
                    return scope.conversation = conversation;
                }
                return back();
            });
    }
}));
