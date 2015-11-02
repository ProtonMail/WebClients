angular.module("proton.controllers.Conversation", ["proton.constants"])

.controller("ConversationController", function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    cacheMessages,
    CONSTANTS,
    conversation,
    Conversation,
    messages,
    networkActivityTracker,
    notify
) {
    $scope.conversation = conversation;
    $scope.messages = messages;
    $scope.mailbox = $state.current.name.replace('secured.', '').replace('.list', '').replace('.view', '');

    // Broadcast active status of this current conversation for the conversation list
    $rootScope.$broadcast('activeConversation', conversation.ID);

    // Listeners
    $scope.$on('refreshConversation', function(event, conversation, messages) {
        _.extend($scope.conversation, conversation);
        _.extend($scope.messages, messages);
        // TODO lost new last message
    });

    /**
     * Initialization call
     */
    $scope.initialization = function() {
        $scope.scrollToMessage(_.last($scope.messages));
    };

    $scope.back = function() {
        $state.go("secured." + $scope.mailbox + '.list', {
            id: null // remove ID
        });
    };

    /**
     * Mark current conversation as read
     */
    $scope.read = function() {
        // TODO generate event
        Conversation.read([$scope.conversation.ID]);
        $scope.back();
    };

    /**
     * Mark current conversation as unread
     */
    $scope.unread = function() {
        // TODO generate event
        Conversation.unread([$scope.conversation.ID]);
        $scope.back();
    };

    /**
     * Delete current conversation
     */
    $scope.delete = function() {
        // TODO generate event
        Conversation.delete([$scope.conversation.ID]);
        $scope.back();
    };

    /**
     * Move current conversation to a specific location
     */
    $scope.move = function(location) {
        // TODO generate event
        Conversation[location]([$scope.conversation.ID]);
        $scope.back();
    };

    /**
     * Scroll to the message specified
     * @param {Object} message
     */
    $scope.scrollToMessage = function(message) {
        var index = $scope.messages.indexOf(message);
        var id = 'message' + index; // TODO improve it for the search case

        $timeout(function() {
            $('#pm_thread').animate({scrollTop: $('#' + id).offset().top}, 'slow');
        }, 1000);
    };

    /**
     * Toggle star conversation
     */
    $scope.toggleStar = function() {
        if($scope.starred()) {
            Conversation.unstar(conversation.ID);
        } else {
            Conversation.star(conversation.ID);
        }

        // TODO generate event
    };

    /**
     * Return status of the star conversation
     */
    $scope.starred = function() {
        if($scope.conversation.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred + '') !== -1) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Go to the next conversation
     */
    $scope.nextConversation = function() {
        var current = $state.current.name;

        cacheMessages.more($scope.conversation.ID, 'next').then(function(id) {
            $state.go(current, {id: id});
        });
    };

    /**
     * Go to the previous conversation
     */
    $scope.previousConversation = function() {
        var current = $state.current.name;

        cacheMessages.more($scope.conversation.ID, 'previous').then(function(id) {
            $state.go(current, {id: id});
        });
    };

    // Call initialization
    $scope.initialization();
});
