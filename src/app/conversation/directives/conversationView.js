angular.module('proton.conversation')
.directive('conversationView', ($stateParams, cache) => ({
    restrict: 'E',
    template: '<conversation ng-if="conversation" conversation="conversation" messages="messages"></conversation>',
    link(scope) {
        const conversationID = $stateParams.id;

        cache.getConversation(conversationID)
        .then((conversation) => {

            scope.conversation = conversation;
        });
    }
}));
