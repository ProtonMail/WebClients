angular.module("proton.controllers.Conversation", ["proton.constants"])

.controller("ConversationController", function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    cacheMessages,
    conversation,
    Conversation,
    messages,
    networkActivityTracker,
    notify
) {
    $scope.conversation = conversation;
    $scope.messages = messages;

    $rootScope.$broadcast('activeConversation', conversation.ID);

    $scope.toggleStar = function() {
        if($scope.starred($scope.conversation)) {
            Conversation.unstar(conversation.ID);
        } else {
            Conversation.star(conversation.ID);
        }

        // TODO generate event
    };

    $scope.nextConversation = function() {
        var current = $state.current.name;
        var location = (angular.isDefined($stateParams.label))?$stateParams.label:CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox];

        cacheMessages.more(conversation.ID, location, 'next').then(function(id) {
            $state.go(current, {id: id});
        });
    };

    $scope.previousConversation = function() {
        var current = $state.current.name;
        var location = (angular.isDefined($stateParams.label))?$stateParams.label:CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox];

        cacheMessages.more(conversation.ID, location, 'previous').then(function(id) {
            $state.go(current, {id: id});
        });
    };
});
