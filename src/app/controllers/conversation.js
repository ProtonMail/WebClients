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
    $scope.messages = messages;
    $scope.mailbox = tools.currentMailbox();
    $scope.labels = authentication.user.Labels;
    $scope.currentState = $state.$current.name;

    // Broadcast active status of this current conversation for the conversation list
    $rootScope.$broadcast('activeElement', conversation.ID);

    // Unactive conversations when this controller is destroyed
    $scope.$on('$destroy', function() {
        $rootScope.$broadcast('unactiveElements');
    });

    // Listeners
    $scope.$on('refreshConversation', function(event) {
        cache.getConversation($stateParams.id).then(function(conversation) {
            _.extend($scope.conversation, conversation); //
        });

        cache.queryConversationMessages($stateParams.id, true).then(function(messages) {
            _.each(messages, function(message) {
                var current = _.findWhere($scope.messages, {ID: message.ID});

                if(angular.isUndefined(current)) {
                    // Add message
                    $scope.messages.push(message);
                }
            });
        });
    });

    /**
     * Method call at the initialization of this controller
     */
    $scope.initialization = function() {
        var open;
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
        var conversationEvent = [];
        var messageEvent = [];
        var conversation = angular.copy($scope.conversation);

        // cache
        conversation.NumUnread = 0;
        conversationEvent.push({Action: 3, ID: conversation.ID, Conversation: conversation});

        _.each(cache.queryMessagesCached(conversation.ID), function(message) {
            message.IsRead = 1;
            messageEvent.push({Action: 3, ID: message.ID, Message: message});
        });


        cache.events(conversationEvent, 'conversation');
        cache.events(messageEvent, 'message');

        // api
        Conversation.read([conversation.ID]);
    };

    /**
     * Mark current conversation as unread
     * @param {Boolean} back
     */
    $scope.unread = function(back) {
        var conversationEvent = [];
        var messageEvent = [];
        var conversation = angular.copy($scope.conversation);

        // cache
        conversation.NumUnread = $scope.messages.length;
        conversationEvent.push({Action: 3, ID: conversation.ID, Conversation: conversation});

        _.each(cache.queryMessagesCached(conversation.ID), function(message) {
            message.IsRead = 0;
            messageEvent.push({Action: 3, ID: message.ID, Message: message});
        });

        cache.events(conversationEvent, 'conversation');
        cache.events(messageEvent, 'message');

        // api
        Conversation.unread([conversation.ID]);
    };

    /**
     * Delete current conversation
     */
    $scope.delete = function() {
        var events = [];
        var conversation = angular.copy($scope.conversation);

        // cache
        events.push({Action: 0, ID: conversation.ID, Conversation: conversation});
        cache.events(events, 'conversation');

        // api
        Conversation.delete([$scope.conversation.ID]);

        // back to conversation list
        $scope.back();
    };

    /**
     * Move current conversation to a specific location
     */
    $scope.move = function(location) {
        var current;
        var events = [];
        var copy = angular.copy($scope.conversation);

        _.each(copy.LabelIDs, function(labelID) {
            if(['0', '1', '2', '3', '4', '6'].indexOf(labelID)) {
                current = labelID;
            }
        });

        // cache
        copy.Selected = false;
        copy.LabelIDsRemoved = [current]; // remove current location
        copy.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[location].toString()]; // Add new location
        events.push({Action: 3, ID: copy.ID, Conversation: copy});
        cache.events(events, 'conversation');

        // api
        Conversation[location]([copy.ID]);

        // back to conversation list
        $scope.back();
    };

    /**
     * Apply labels for the current conversation
     * @return {Promise}
     */
    $scope.saveLabels = function(labels, alsoArchive) {
        var REMOVE = 0;
        var ADD = 1;
        var deferred = $q.defer();
        var ids = [$scope.conversation.ID];
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];
        var conversationEvent = [];
        var messageEvent = [];
        var copy = angular.copy($scope.conversation);
        var currents = [];

        _.each(toApply, function(labelID) {
            promises.push(Conversation.labels(labelID, ADD, ids));
        });

        _.each(toRemove, function(labelID) {
            promises.push(Conversation.labels(labelID, REMOVE, ids));
        });

        // Find current location
        _.each(copy.LabelIDs, function(labelID) {
            if(['0', '1', '2', '3', '4', '6'].indexOf(labelID) !== -1) {
                currents.push(labelID.toString());
            }
        });

        if(alsoArchive === true) {
            toApply.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive); // Add in archive
            toRemove = toRemove.concat(currents); // Remove current location
        }

        copy.LabelIDsAdded = toApply;
        copy.LabelIDsRemoved = toRemove;
        conversationEvent.push({Action: 3, ID: copy.ID, Conversation: copy});
        cache.events(conversationEvent, 'conversation');

        _.each($scope.messages, function(message) {
            var copyMessage = angular.copy(message);

            copyMessage.LabelIDsAdded = toApply;
            copyMessage.LabelIDsRemoved = toRemove;
            messageEvent.push({Action: 3, ID: copyMessage.ID, Message: copyMessage});
        });

        cache.events(messageEvent, 'message');

        $q.all(promises).then(function(results) {
            if(alsoArchive === true) {
                deferred.resolve(Conversation.archive(ids));
            } else {
                deferred.resolve();
            }
        }, function(error) {
            error.message = $translate.instant('ERROR_DURING_THE_LABELS_REQUEST');
            deferred.reject(error);
        });

        return deferred.promise;
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
        var conversationEvent = [];
        var messageEvent = [];
        var copy = angular.copy(conversation);
        var messages = cache.queryMessagesCached(copy.ID);

        copy.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
        conversationEvent.push({ID: copy.ID, Action: 2, Conversation: copy});
        cache.events(conversationEvent, 'conversation');

        if(messages.length > 0) {
            _.each(messages, function(message) {
                message.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
                messageEvent.push({ID: message.ID, Action: 3, Message: message});
            });
            cache.events(messageEvent, 'message');
        }

        Conversation.star([copy.ID]);
    };

    /**
     * Unstar the current conversation
     */
    $scope.unstar = function() {
        var conversationEvent = [];
        var messageEvent = [];
        var copy = angular.copy(conversation);
        var messages = cache.queryMessagesCached(copy.ID);

        copy.LabelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
        conversationEvent.push({ID: copy.ID, Action: 2, Conversation: copy});
        cache.events(conversationEvent, 'conversation');

        if(messages.length > 0) {
            _.each(messages, function(message) {
                message.LabelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
                messageEvent.push({ID: message.ID, Action: 3, Message: message});
            });
            cache.events(messageEvent, 'message');
        }

        Conversation.unstar([copy.ID]);
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
