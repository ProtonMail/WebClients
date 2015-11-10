angular.module("proton.controllers.Conversation", ["proton.constants"])

.controller("ConversationController", function(
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
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

    // Broadcast active status of this current conversation for the conversation list
    $rootScope.$broadcast('activeConversation', conversation.ID);

    // Listeners
    $scope.$on('refreshConversation', function(event) {
        cache.getConversation($stateParams.id).then(function(conversation) {
            _.extend($scope.conversation, conversation);
        });

        cache.queryConversationMessages($stateParams.id, true).then(function(messages) {
            _.extend($scope.messages, messages);
            // TODO display last new last message
        });
    });

    /**
     * Initialization call
     */
    $scope.initialization = function() {
        var open;

        if($scope.mailbox === 'drafts') {
            // Remove the last message in conversation view
            var popped = $scope.messages.pop();
            // Open it in the composer
            cache.getMessage(popped.ID).then(function(message) {
                message.decryptBody(message.Body, message.Time).then(function(body) {
                    message.Body = body;

                    if(message.Attachments && message.Attachments.length > 0) {
                        message.attachmentsToggle = true;
                    }

                    $rootScope.$broadcast('loadMessage', message);
                }, function(error) {
                    notify({message: 'Error during the decryption of the message', classes: 'notification-danger'});
                    $log.error(error); // TODO send to back-end
                });
            }, function(error) {
                notify({message: 'Error during the getting message', classes: 'notification-danger'});
                $log.error(error); // TODO send to back-end
            });
        }

        if(angular.isDefined($rootScope.openMessage)) {
            open = _.where($scope.messages, {ID: $rootScope.openMessage})[0];
        } else {
            open = _.last($scope.messages);
        }

        $scope.scrollToMessage(open);
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
        var events = [];
        var conversation = angular.copy($scope.conversation);

        // cache
        conversation.NumUnread = 0;
        events.push({Action: 3, ID: conversation.ID, Conversation: conversation});
        cache.events(events, 'conversation');

        // api
        Conversation.read([conversation.ID]);
        $scope.back();
    };

    /**
     * Mark current conversation as unread
     */
    $scope.unread = function() {
        var events = [];
        var conversation = angular.copy($scope.conversation);

        // cache
        conversation.NumUnread = $scope.messages.length;
        events.push({Action: 3, ID: conversation.ID, Conversation: conversation});
        cache.events(events, 'conversation');

        // api
        Conversation.unread([conversation.ID]);

        // back to conversation list
        $scope.back();
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
        copy.LabelIDsRemoved = [current]; // remove current location
        copy.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[location].toString()]; // Add new location
        events.push({Action: 3, ID: copy.ID, Conversation: copy});
        cache.events(events, 'conversation');

        // api
        Conversation[location]([copy.ID]);

        // back to conversation list
        $scope.back();
    };

    $scope.conversationMessages = function() {
        return $scope.messages;
    };

    /**
     * Apply labels for the current conversation
     * @return {Promise}
     */
    $scope.saveLabels = function(labels, alsoArchive) {
        var deferred = $q.defer();
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var APPLY = 1;
        var REMOVE = 0;

        // Detect if a message will have too many labels
        _.each($scope.messages, function(message) {
            if(_.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove).length > 5) {
                tooManyLabels = true;
            }
        });

        if(tooManyLabels) {
            deferred.reject(new Error($translate.instant('TOO_MANY_LABELS_ON_MESSAGE')));
        } else {
            _.each(toApply, function(labelID) {
                promises.push(Conversation.labels(labelID, 1, [$scope.conversation.ID]));
            });

            _.each(toRemove, function(labelID) {
                promises.push(Conversation.labels(labelID, 0, [$scope.conversation.ID]));
            });

            $q.all(promises).then(function(results) {
                // TODO generate event
            }, function(error) {
                error.message = $translate.instant('ERROR_DURING_THE_LABELS_REQUEST');
                deferred.reject(error);
            });

            networkActivityTracker.track(deferred.promise);
        }

        return deferred.promise;
    };

    /**
     * Scroll to the message specified
     * @param {Object} message
     */
    $scope.scrollToMessage = function(message) {
        var index = $scope.messages.indexOf(message);
        var id = 'message' + index; // TODO improve it for the search case

        $timeout(function() {
            var value = $('#' + id).offset().top - $('#' + id).outerHeight();
            
            $('#pm_thread').animate({
                scrollTop: value
            }, 'slow');
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
        var events = [];
        var copy = angular.copy(conversation);
        var messages = cache.queryMessagesCached(copy.ID);

        copy.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
        events.push({ID: copy.ID, Action: 2, Conversation: copy});
        cache.events(events, 'conversation');

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
        var events = [];
        var copy = angular.copy(conversation);
        var messages = cache.queryMessagesCached(copy.ID);

        copy.LabelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
        events.push({ID: copy.ID, Action: 2, Conversation: copy});
        cache.events(events, 'conversation');

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
     */
    $scope.starred = function() {
        return $scope.conversation.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
    };

    /**
     * Go to the next conversation
     */
    $scope.nextConversation = function() {
        var current = $state.current.name;

        cache.more($scope.conversation.ID, 'next').then(function(id) {
            $state.go(current, {id: id});
        });
    };

    /**
     * Go to the previous conversation
     */
    $scope.previousConversation = function() {
        var current = $state.current.name;

        cache.more($scope.conversation.ID, 'previous').then(function(id) {
            $state.go(current, {id: id});
        });
    };

    // Call initialization
    $scope.initialization();
});
