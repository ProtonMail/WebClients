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
    networkActivityTracker,
    notify,
    tools
) {
    var scrollPromise;

    $scope.mailbox = tools.currentMailbox();
    $scope.labels = authentication.user.Labels;
    $scope.currentState = $state.$current.name;
    $scope.scrolled = false;
    $scope.conversation = conversation;
    $scope.showTrashed = false;
    $scope.showNonTrashed = false;
    $rootScope.numberElementSelected = 1;
    $rootScope.showWelcome = false;
    $scope.inTrash = $state.is('secured.trash.view');

    // Listeners
    $scope.$on('refreshConversation', function(event) {
        $scope.refreshConversation();
    });

    $scope.$on('$destroy', function(event) {
        $timeout.cancel(scrollPromise);
    });

    /**
     * Method call at the initialization of this controller
     */
    $scope.initialization = function() {
        var loc = tools.currentLocation();

        if (angular.isDefined(conversation)) {
            var labels = conversation.LabelIDs;
            var messages = cache.queryMessagesCached($scope.conversation.ID);

            if($state.is('secured.starred.view') === false && $state.is('secured.label.view') === false && $state.is('secured.search.view') === false) {
                // Remove trashed message
                if ($state.is('secured.trash.view') === false && $scope.showTrashed === false) {
                    messages = _.reject(messages, function(message) { return message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash) !== -1; });
                }

                // Remove non trashed message
                if ($state.is('secured.trash.view') === true && $scope.showNonTrashed === false) {
                    messages = _.reject(messages, function(message) { return message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash) === -1; });
                }
            }

            // Sort by time
            messages = cache.orderMessage(messages).reverse();

            if (messages.length > 0) {
                var latest = _.last(messages);

                if($state.is('secured.sent.view')) { // If we open a conversation in the sent folder
                    var sents = _.where(messages, { AddressID: authentication.user.Addresses[0].ID });

                    if(sents.length > 0) {
                        // We try to open the last sent message
                        $state.go('.', {message: _.last(sents).ID});
                    } else {
                        // Or the last message
                        $state.go('.', {message: _.last(messages).ID});
                    }
                } else if ($state.is('secured.search.view') || $state.is('secured.drafts.view')) {
                    // Do nothing, target initialized by click
                } else if ($state.is('secured.starred.view')) {
                    // Select the last message starred
                    var lastStarred = _.chain(messages).filter(function(message) {
                        return message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
                    }).last().value();

                    $state.go('.', {message: lastStarred.ID});
                } else if ($state.is('secured.label.view')) {
                    // Select the last message with this label
                    var lastLabel = _.chain(messages).filter(function(message) {
                        return message.LabelIDs.indexOf($stateParams.label) !== -1;
                    }).last().value();

                    $state.go('.', {message: lastLabel.ID});
                } else {
                    // If the latest message is read, we open it
                    if(latest.IsRead === 1) {
                        $state.go('.', {message: latest.ID});
                    } else {
                        // Else we open the first message unread beginning to the end list
                        var loop = true;
                        var index = messages.length - 1;

                        while(loop === true && index > 0) {
                            index--;

                            if(messages[index].IsRead === 1) { // Is read
                                loop = false;
                                index++;
                            }
                        }

                        if (loop === true) { // No message read found
                            index = 0;
                        }

                        $state.go('.', {message: messages[index].ID});
                    }
                }

                $scope.messages = messages;
            } else {
                $scope.back();
            }
        } else {
            $scope.back();
        }
    };

    $scope.refreshConversation = function() {
        var conversation = cache.getConversationCached($stateParams.id);
        var messages = cache.queryMessagesCached($stateParams.id);
        var loc = tools.currentLocation();

        if(angular.isDefined(conversation)) {
            var labels = conversation.LabelIDs;

            if(labels.indexOf(loc) !== -1 || loc === CONSTANTS.MAILBOX_IDENTIFIERS.search) {
                _.extend($scope.conversation, conversation);
            } else {
                return $scope.back();
            }
        } else {
            return $scope.back();
        }

        if(angular.isArray(messages) && messages.length > 0) {
            var toAdd = [];
            var toRemove = [];
            var index, message, found, ref;
            var find = function(messages, ID) {
                return _.find(messages, function(m) { return m.ID === ID; });
            };

            if($state.is('secured.starred.view') === false && $state.is('secured.label.view') === false && $state.is('secured.search.view') === false) {
                // Remove trashed message
                if ($state.is('secured.trash.view') === false && $scope.showTrashed === false) {
                    messages = _.reject(messages, function(message) { return message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash) !== -1; });
                }

                // Remove non trashed message
                if ($state.is('secured.trash.view') === true && $scope.showNonTrashed === false) {
                    messages = _.reject(messages, function(message) { return message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash) === -1; });
                }
            }

            // Sort by time
            messages = cache.orderMessage(messages).reverse();

            for (index = 0; index < messages.length; index++) {
                found = find($scope.messages, messages[index].ID);

                if (angular.isUndefined(found)) {
                    toAdd.push({index: index, message: messages[index]});
                }
            }

            for (index = 0; index < toAdd.length; index++) {
                ref = toAdd[index];

                // Insert new message
                $scope.messages.splice(ref.index, 0, ref.message);
            }

            for (index = 0; index < $scope.messages.length; index++) {
                found = find(messages, $scope.messages[index].ID);

                if (angular.isUndefined(found)) {
                    toRemove.push({index: index});
                }
            }

            for (index = toRemove.length - 1; index >= 0; index--) {
                ref = toRemove[index];

                // Remove message deleted
                $scope.messages.splice(ref.index, 1);
            }
        } else {
            $scope.back();
        }
    };

    /**
     * Return if there are trashed message inside this conversation
     * @return {Boolean}
     */
    $scope.trashed = function() {
        return $scope.conversation.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash) !== -1;
    };

    /**
     * Return if there are non trashed message inside this conversation
     * @return {Boolean}
     */
    $scope.nonTrashed = function() {
        var result = false;
        var locations = [
            CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
            CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
            CONSTANTS.MAILBOX_IDENTIFIERS.sent,
            CONSTANTS.MAILBOX_IDENTIFIERS.spam,
            CONSTANTS.MAILBOX_IDENTIFIERS.starred,
            CONSTANTS.MAILBOX_IDENTIFIERS.archive
        ];

        _.each($scope.conversation.LabelIDs, function(labelID) {
            if (locations.indexOf(labelID) !== -1) {
                result = true;
            }
        });

        return result;
    };

    /**
     * Toggle trashed messages
     */
    $scope.toggleTrashed = function() {
        $scope.showTrashed = !$scope.showTrashed;
        $scope.refreshConversation();
    };

    /**
     * Toggle non trashed messages
     */
    $scope.toggleNonTrashed = function() {
        $scope.showNonTrashed = !$scope.showNonTrashed;
        $scope.refreshConversation();
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

        $scope.back();
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
        $timeout.cancel(scrollPromise);
        var index = _.findIndex($scope.messages, {ID: ID});
        var id = '#message' + index;

        scrollPromise = $timeout(function() {
            var element = angular.element(id);

            if(angular.isElement(element) && angular.isDefined(element.offset())) {
                var headerOffset = $('#conversationHeader').offset().top + $('#conversationHeader').outerHeight();
                var amountScrolled = $('#pm_thread').scrollTop();
                var paddingTop = parseInt($('#pm_thread').css('padding-top').replace('px', ''));
                var value = element.offset().top + amountScrolled - headerOffset - paddingTop;

                if (index === 0) {
                    // Do nothing
                } else if (index === 1) {
                    value -= 15;
                } else if (index > 1) {
                    value -= 68;
                }

                $('#pm_thread').animate({
                    scrollTop: value
                }, 200);
            }
        }, 100);
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

    // Call initialization
    $scope.initialization();

});
