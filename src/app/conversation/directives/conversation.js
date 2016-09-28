angular.module('proton.conversation')
.directive('conversation', (
    $filter,
    $rootScope,
    $state,
    $stateParams,
    $timeout,
    actionConversation,
    authentication,
    cache,
    CONSTANTS,
    tools
) => ({
    restrict: 'E',
    scope: {
        conversation: '='
    },
    templateUrl: 'templates/partials/conversation.tpl.html',
    link(scope) {
        var scrollPromise;
        var messagesCached = [];
        const unsubscribe = [];

        scope.mailbox = tools.currentMailbox();
        scope.labels = authentication.user.Labels;
        scope.currentState = $state.$current.name;
        scope.scrolled = false;
        scope.showTrashed = false;
        scope.showNonTrashed = false;
        $rootScope.numberElementSelected = 1;
        $rootScope.showWelcome = false;
        scope.inTrash = $state.includes('secured.trash.**');
        scope.inSpam = $state.includes('secured.spam.**');
        scope.markedMessage = null;

        // Listeners
        unsubscribe.push($rootScope.$on('refreshConversation', (event, conversationIDs) => {
            if (conversationIDs.indexOf(scope.conversation.ID) > -1) {
                scope.refreshConversation();
            }
        }));

        scope.$on('$destroy', () => {
            $timeout.cancel(scrollPromise);
            unsubscribe.forEach(cb => cb());
            unsubscribe.length = 0;
        });

        scope.$on('unmarkMessages', function(event) {
            scope.markedMessage = null;
        });

        scope.$on('markPrevious', function(event) {
            if (scope.markedMessage) {
                var index = scope.messages.indexOf(scope.markedMessage);

                if (index > 0) {
                    scope.markedMessage = scope.messages[index - 1];
                    scope.$apply();
                    angular.element('#pm_thread').scrollTop(angular.element('.message.marked')[0].offsetTop - angular.element('#pm_thread').height() / 2);
                }
            }
        });

        scope.$on('markNext', function(event) {
            if (scope.markedMessage) {
                var index = scope.messages.indexOf(scope.markedMessage);

                if (index < (scope.messages.length - 1)) {
                    scope.markedMessage = scope.messages[index + 1];
                    scope.$apply();
                    angular.element('#pm_thread').scrollTop(angular.element('.message.marked')[0].offsetTop - angular.element('#pm_thread').height() / 2);
                }
            }
        });

        scope.$on('toggleStar', function(event) {
            scope.toggleStar();
        });

        scope.$on('left', function(event) {
            scope.markedMessage = null;
            scope.$apply();
        });

        scope.$on('right', function(event) {
            scope.markedMessage = _.last(scope.messages);
            scope.$apply();
            angular.element('#pm_thread').scrollTop(angular.element('.message.marked')[0].offsetTop - angular.element('#pm_thread').height() / 2);
            angular.element('#pm_thread')[0].focus();
        });

        scope.$on('escape', function(event) {
            back();
        });

        /**
         * Back to the parent state
         */
        function back() {
            const name = $state.$current.name;
            const route = name.replace('.element', '');

            $state.go(route, { id: null });
        }

        /**
         * Set a flag (expand) to the message to be expanded
         * @param {Array} messages
         * @return {Array} messages
         */
        function expandMessage(messages = []) {
            let thisOne;
            const type = tools.typeView();

             if (type === 'message') { // If we open a conversation in the sent folder
                thisOne = _.last(messages);
            } else if ($stateParams.messageID) {
                thisOne = _.findWhere(messages, {ID: $stateParams.messageID});
            } else if ($state.includes('secured.starred.**')) {
                // Select the last message starred
                thisOne = _.chain(messages).filter((message) => {
                    return message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
                }).last().value();
            } else if ($state.includes('secured.label.**')) {
                // Select the last message with this label
                thisOne = _.chain(messages).filter((message) => {
                    return message.LabelIDs.indexOf($stateParams.label) !== -1;
                }).last().value();
            } else {
                const latest = _.last(messages);
                // If the latest message is read, we open it
                if (latest.IsRead === 1) {
                    thisOne = latest;
                } else {
                    // Else we open the first message unread beginning to the end list
                    let loop = true;
                    let index = messages.length - 1;

                    while (loop === true && index > 0) {
                        index--;

                        if (messages[index].IsRead === 1) { // Is read
                            loop = false;
                            index++;
                        }
                    }

                    if (loop === true) { // No message read found
                        index = 0;
                    }

                    thisOne = messages[index];
                }
            }

            thisOne.openMe = true;

            return messages;
        }

        /**
         * Method call at the initialization of this directive
         */
        function initialization() {
            var messages = [];

            messagesCached = cache.queryMessagesCached($stateParams.id);
            scope.trashed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash) === true; }).length > 0;
            scope.nonTrashed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash) === false; }).length > 0;
            // scope.spammed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.spam) === true; }).length > 0;
            // scope.nonSpammed = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.spam) === false; }).length > 0;
            messages = $filter('filterMessages')(messagesCached, scope.showTrashed, scope.showNonTrashed);


            if (messages.length > 0) {
                scope.messages = expandMessage(cache.orderMessage(messages, false));

                if (authentication.user.ViewLayout === CONSTANTS.ROW_MODE) {
                    scope.markedMessage = $rootScope.expandMessage;
                }
            } else {
                back();
            }
        }

        /**
         * Refresh the current conversation with the latest change reported by the event log manager
         */
        scope.refreshConversation = () => {
            const conversation = cache.getConversationCached($stateParams.id);
            let messages = cache.queryMessagesCached($stateParams.id);
            const loc = tools.currentLocation();

            messagesCached = messages;
            scope.trashed = messagesCached.filter(({LabelIDs = []}) => _.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash)).length > 0;
            scope.nonTrashed = messagesCached.filter(({LabelIDs = []}) => !_.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.trash)).length > 0;

            if (conversation) {
                if (conversation.LabelIDs.indexOf(loc) !== -1 || $state.includes('secured.search.**')) {
                    _.extend(scope.conversation, conversation);
                } else {
                    return back();
                }
            } else {
                return back();
            }

            if (angular.isArray(messages) && messages.length > 0) {
                const toAdd = [];
                const toRemove = [];
                let index, found, ref;

                messages = $filter('filterMessages')(messages, scope.showTrashed, scope.showNonTrashed);
                messages = cache.orderMessage(messages, false);

                for (index = 0; index < messages.length; index++) {
                    found = _.findWhere(scope.messages, {ID: messages[index].ID});

                    if (!found) {
                        toAdd.push({index: index, message: messages[index]});
                    }
                }

                for (index = 0; index < toAdd.length; index++) {
                    ref = toAdd[index];

                    // Insert new message at a specific index
                    scope.messages.splice(ref.index, 0, ref.message);
                }

                for (index = 0; index < scope.messages.length; index++) {
                    found = _.findWhere(messages, {ID: scope.messages[index].ID});

                    if (!found) {
                        toRemove.push({index: index});
                    }
                }

                for (index = toRemove.length - 1; index >= 0; index--) {
                    ref = toRemove[index];

                    // Remove message deleted
                    scope.messages.splice(ref.index, 1);
                }
            } else {
                back();
            }
        };

        scope.toggleOption = function(option) {
            scope[option] = !!!scope[option];
            scope.refreshConversation();
        };

        /**
         * @return {Boolean}
         */
        scope.showNotifier = function(folder) {
            const filtered = _.filter(messagesCached, function(message) { return _.contains(message.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS[folder]); });

            return filtered.length < messagesCached.length && filtered.length > 0;
        };

        /**
         * Return messages data for dropdown labels
         */
        scope.getMessages = function() {
            return scope.messages;
        };

        /**
         * Mark current conversation as read
         * @param {Boolean} back
         */
        scope.read = function() {
            const ids = [scope.conversation.ID];

            actionConversation.readConversation(ids);
        };

        /**
         * Mark current conversation as unread
         */
        scope.unread = function() {
            const ids = [scope.conversation.ID];

            actionConversation.unreadConversation(ids);

            back();
        };

        /**
         * Delete current conversation
         */
        scope.delete = function() {
            const ids = [scope.conversation.ID];

            actionConversation.deleteConversation(ids);
        };

        /**
         * Move current conversation to a specific location
         */
        scope.move = function(mailbox) {
            const ids = [scope.conversation.ID];

            actionConversation.moveConversation(ids, mailbox);
        };

        /**
         * Apply labels for the current conversation
         * @return {Promise}
         */
        scope.saveLabels = function(labels, alsoArchive) {
            const ids = [scope.conversation.ID];

            actionConversation.labelConversation(ids, labels, alsoArchive);
        };

        /**
         * Scroll to the message specified
         * @param {String} ID
         */
        scope.scrollToMessage = function(ID) {
            $timeout.cancel(scrollPromise);
            var index = _.findIndex(scope.messages, {ID: ID});
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
         scope.toggleStar = function() {
            if(scope.starred() === true) {
                scope.unstar();
            } else {
                scope.star();
            }
         };

        /**
         * Star the current conversation
         */
        scope.star = function() {
            actionConversation.starConversation(scope.conversation.ID);
        };

        /**
         * Unstar the current conversation
         */
        scope.unstar = function() {
            actionConversation.unstarConversation(scope.conversation.ID);
        };

        /**
         * Return status of the star conversation
         * @return {Boolean}
         */
        scope.starred = function() {
            return scope.conversation.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
        };
        // Call initialization
        initialization();
    }
}));
