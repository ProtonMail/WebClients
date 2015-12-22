angular.module("proton.controllers.Conversation", ["proton.constants"])

.controller("ConversationController", function(
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    $q,
    action,
    authentication,
    cache,
    CONSTANTS,
    conversation,
    Conversation,
    messages,
    networkActivityTracker,
    notify,
    tools
) {
    $scope.conversation = conversation;
    $scope.messages = messages; // We reverse the array because the new message appear to the bottom of the list
    $scope.mailbox = tools.currentMailbox();
    $scope.labels = authentication.user.Labels;
    $scope.currentState = $state.$current.name;

    // Listeners
    $scope.$on('refreshConversation', function(event) {
        var conversation = cache.getConversationCached($stateParams.id);
        var messages = cache.queryMessagesCached($stateParams.id);

        if(angular.isDefined(conversation)) {
            _.extend($scope.conversation, conversation);
        } else {
            $scope.back();
        }

        if(angular.isDefined(messages)) {
            _.each(messages, function(message) {
                var current = _.findWhere($scope.messages, {ID: message.ID});
                var index = $rootScope.discarded.indexOf(message.ID); // Check if the message is not discarded

                if(angular.isUndefined(current) && index === -1) {
                    // If the message is not a draft, open it
                    if(message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts) === -1) {
                        $rootScope.openMessage = $rootScope.openMessage || [];
                        $rootScope.openMessage.push(message.ID);
                    }
                    // Add message
                    $scope.messages.push(message);
                }
            });

            _.each($scope.messages, function(message) {
                var current = _.findWhere(messages, {ID: message.ID});

                if(angular.isUndefined(current)) {
                    var index = $scope.messages.indexOf(current);
                    // Delete message
                    $scope.messages.splice(index, 1);
                }
            });

            if($scope.messages.length === 0) {
                $scope.back();
            }
        }
    });

    /**
     * Method call at the initialization of this controller
     */
    $scope.initialization = function() {
        var unreads = _.where($scope.messages, {IsRead: 0});

        if(angular.isDefined($rootScope.openMessage)) { // Open specific message
            // '$rootScope.openMessage' already initialized when the user click
        } else if(unreads.length > 0) {
            // Open all unread messages
            $rootScope.openMessage = _.map(unreads, function(message) { return message.ID; });
        } else {
            // Open the only lastest
            $rootScope.openMessage = [_.last($scope.messages).ID];
        }

        $rootScope.scrollToFirst = _.first($rootScope.openMessage);

        // Mark conversation as read
        if($scope.conversation.NumUnread > 0) {
            $scope.read();
        }
    };

    /**
     * Back to conversation / message list
     */
    $scope.back = function() {
        $state.go("secured." + $scope.mailbox + '.list', {
            id: null // remove ID
        });
    };

    /**
     * Return messages data for dropdown labels
     */
    $scope.getMessages = function() {
        return $scope.messages;
    };

    /**
     * Mark current conversation as read
     * @param {Boolean} back
     */
    $scope.read = function() {
        var ids = [$scope.conversation.ID];

        action.readConversation(ids);
    };

    /**
     * Mark current conversation as unread
     */
    $scope.unread = function() {
        var ids = [$scope.conversation.ID];

        action.unreadConversation(ids);
    };

    /**
     * Delete current conversation
     */
    $scope.delete = function() {
        var ids = [$scope.conversation.ID];

        action.deleteConversation(ids);
    };

    /**
     * Move current conversation to a specific location
     */
    $scope.move = function(mailbox) {
        var ids = [$scope.conversation.ID];

        action.moveConversation(ids, mailbox);
    };

    /**
     * Apply labels for the current conversation
     * @return {Promise}
     */
    $scope.saveLabels = function(labels, alsoArchive) {
        var ids = [$scope.conversation.ID];

        action.labelConversation(ids, labels, alsoArchive);
    };

    /**
     * Scroll to the message specified
     * @param {String} ID
     */
    $scope.scrollToMessage = function(ID) {
        var index = _.findIndex($scope.messages, {ID: ID});
        var id = '#message' + index; // TODO improve it for the search case

        $timeout(function() {
            var element = angular.element(id);

            if(angular.isElement(element)) {
                var value = element.offset().top - element.outerHeight();

                $('#pm_thread')
                .animate({
                    scrollTop: value
                }, 10, function() {
                    $(this).animate({
                        opacity: 1
                    }, 200);
                });
            }
        }, 2000);
    };

    /**
     * Toggle star status for current conversation
     */
     $scope.toggleStar = function() {
        if($scope.starred() === true) {
            $scope.unstar();
        } else {
            $scope.star();
        }
     };

    /**
     * Star the current conversation
     */
    $scope.star = function() {
        action.starConversation($scope.conversation.ID);
    };

    /**
     * Unstar the current conversation
     */
    $scope.unstar = function() {
        action.unstarConversation($scope.conversation.ID);
    };

    /**
     * Return status of the star conversation
     * @return {Boolean}
     */
    $scope.starred = function() {
        return $scope.conversation.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
    };

    /**
     * Go to the next conversation
     */
    $scope.next = function() {
        var current = $state.$current.name;

        cache.more($scope.conversation, 'next').then(function(id) {
            // $state.go(current, {id: id});
        });
    };

    /**
     * Go to the previous conversation
     */
    $scope.previous = function() {
        var current = $state.$current.name;

        cache.more($scope.conversation, 'previous').then(function(id) {
            // $state.go(current, {id: id});
        });
    };

    // Call initialization
    $scope.initialization();
});
