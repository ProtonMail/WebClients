angular.module("proton.controllers.Conversation", ["proton.constants"])

.controller("ConversationController", function(
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    gettextCatalog,
    $q,
    $filter,
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
    var messagesCached = [];

    $scope.mailbox = tools.currentMailbox();
    $scope.labels = authentication.user.Labels;
    $scope.currentState = $state.$current.name;
    $scope.scrolled = false;
    $scope.conversation = conversation;
    $rootScope.showTrashed = false;
    $rootScope.showNonTrashed = false;
    $rootScope.showSpammed = false;
    $rootScope.showNonSpammed = false;
    $rootScope.numberElementSelected = 1;
    $rootScope.showWelcome = false;
    $scope.inTrash = $state.is('secured.trash.view');
    $scope.inSpam = $state.is('secured.spam.view');
    $scope.markedMessage = null;

    // Listeners
    $scope.$on('refreshConversation', function(event) {
        $scope.refreshConversation();
    });

    $scope.$on('unmarkMessages', function(event) {
        $scope.markedMessage = null;
    });

    $scope.$on('markPrevious', function(event) {
        if ($scope.markedMessage) {
            var index = $scope.messages.indexOf($scope.markedMessage);

            if (index > 0) {
                $scope.markedMessage = $scope.messages[index - 1];
                $scope.$apply();
                angular.element('#pm_thread').scrollTop(angular.element('.message.marked')[0].offsetTop - angular.element('#pm_thread').height() / 2);
            }
        }
    });

    $scope.$on('markNext', function(event) {
        if ($scope.markedMessage) {
            var index = $scope.messages.indexOf($scope.markedMessage);

            if (index < ($scope.messages.length - 1)) {
                $scope.markedMessage = $scope.messages[index + 1];
                $scope.$apply();
                angular.element('#pm_thread').scrollTop(angular.element('.message.marked')[0].offsetTop - angular.element('#pm_thread').height() / 2);
            }
        }
    });

    $scope.$on('toggleStar', function(event) {
        $scope.toggleStar();
    });

    $scope.$on('left', function(event) {
        $scope.markedMessage = null;
        $scope.$apply();
    });

    $scope.$on('right', function(event) {
        $scope.markedMessage = _.last($scope.messages);
        $scope.$apply();
        angular.element('#pm_thread').scrollTop(angular.element('.message.marked')[0].offsetTop - angular.element('#pm_thread').height() / 2);
        angular.element('#pm_thread')[0].focus();
    });

    $scope.$on('escape', function(event) {
        $scope.back();
    });

    $scope.$on('$destroy', function(event) {
        $timeout.cancel(scrollPromise);
    });

    /**
     * Search and ask to expand a message
     */
    function expandMessage(messages) {
        if ($state.is('secured.sent.view')) { // If we open a conversation in the sent folder
            var sents = _.where(messages, { AddressID: authentication.user.Addresses[0].ID });

            if (sents.length > 0) {
                // We try to open the last sent message
                $rootScope.expandMessage = _.last(sents);
            } else {
                // Or the last message
                $rootScope.expandMessage = _.last(messages);
            }
        } else if ($state.is('secured.search.view') || $state.is('secured.drafts.view')) {
            // Do nothing, target initialized by click
        } else if ($state.is('secured.starred.view')) {
            // Select the last message starred
            var lastStarred = _.chain(messages).filter(function(message) {
                return message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
            }).last().value();

            $rootScope.expandMessage = lastStarred;
        } else if ($state.is('secured.label.view')) {
            // Select the last message with this label
            var lastLabel = _.chain(messages).filter(function(message) {
                return message.LabelIDs.indexOf($stateParams.label) !== -1;
            }).last().value();

            $rootScope.expandMessage = lastLabel;
        } else {
            var latest = _.last(messages);
            // If the latest message is read, we open it
            if(latest.IsRead === 1) {
                $rootScope.expandMessage = latest;
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

                $rootScope.expandMessage = messages[index];
            }
        }
    }

    /**
     * Method call at the initialization of this controller
     */
    $scope.initialization = function() {
        var loc = tools.currentLocation();

        if (angular.isDefined(conversation)) {
            var messages = [];

            messagesCached = cache.queryMessagesCached($stateParams.id);
            $scope.trashed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash) === true; }).length > 0;
            $scope.nonTrashed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash) === false; }).length > 0;
            // $scope.spammed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.spam) === true; }).length > 0;
            // $scope.nonSpammed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.spam) === false; }).length > 0;
            messages = $filter('filterMessages')(messagesCached);


            if (messages.length > 0) {
                $scope.messages = cache.orderMessage(messages, false);
                expandMessage($scope.messages);
            } else {
                $scope.back();
            }
        } else {
            $scope.back();
        }
    };

    /**
     * Refresh the current conversation with the latest change reported by the event log manager
     */
    $scope.refreshConversation = function() {
        var conversation = cache.getConversationCached($stateParams.id);
        var messages = cache.queryMessagesCached($stateParams.id);
        var loc = tools.currentLocation();

        messagesCached = messages;
        $scope.trashed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash) === true; }).length > 0;
        $scope.nonTrashed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash) === false; }).length > 0;
        // $scope.spammed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.spam) === true; }).length > 0;
        // $scope.nonSpammed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.spam) === false; }).length > 0;

        if (angular.isDefined(conversation)) {
            var labels = conversation.LabelIDs;

            if(labels.indexOf(loc) !== -1 || loc === CONSTANTS.MAILBOX_IDENTIFIERS.search) {
                _.extend($scope.conversation, conversation);
            } else {
                return $scope.back();
            }
        } else {
            return $scope.back();
        }

        if (angular.isArray(messages) && messages.length > 0) {
            var toAdd = [];
            var toRemove = [];
            var index, message, found, ref;
            const lookFor = (messages, ID) => _.find(messages, (m = {}) => m.ID === ID);
            messages = $filter('filterMessages')(messages);
            messages = cache.orderMessage(messages, false);

            for (index = 0; index < messages.length; index++) {
                found = lookFor($scope.messages, messages[index].ID);

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
                found = lookFor(messages, $scope.messages[index].ID);

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

    $scope.toggleOption = function(option) {
        $rootScope[option] = !!!$rootScope[option];
        $scope.refreshConversation();
    };

    /**
     * @return {Boolean}
     */
    $scope.showNotifier = function(folder) {
        var filtered = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS[folder]); });

        return filtered.length < messagesCached.length && filtered.length > 0;
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
