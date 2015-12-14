angular.module("proton.controllers.Conversations", ["proton.constants"])

.controller('ConversationsController', function(
    $q,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    $filter,
    $window,
    CONSTANTS,
    Conversation,
    Message,
    expiration,
    Label,
    authentication,
    cache,
    preloadConversation,
    confirmModal,
    cacheCounters,
    networkActivityTracker,
    notify,
    tools
) {
    var lastChecked = null;

    /**
     * Method called at the initialization of this controller
     */
    $scope.initialization = function() {
        // Variables
        $scope.mailbox = tools.currentMailbox();
        $scope.conversationsPerPage = authentication.user.NumMessagePerPage;
        $scope.labels = authentication.user.Labels;
        $scope.messageButtons = authentication.user.MessageButtons;
        $scope.Math = window.Math;
        $scope.CONSTANTS = CONSTANTS;
        $scope.selectedFilter = $stateParams.filter;
        $scope.selectedOrder = $stateParams.sort || "-date";
        $scope.page = parseInt($stateParams.page || 1);
        $scope.startWatchingEvent();
        $scope.mobileResponsive();
        networkActivityTracker.track($scope.refreshConversations().then(function() {
            $scope.$watch('conversations', function(newValue, oldValue) {
                // Manage preload of conversations or messages
                // Andy doesn't want to apply this for the moment, it's too expensive for the back-end
                // preloadConversation.set(newValue);
                // Manage expiration time
                expiration.check(newValue);
                $rootScope.numberElementSelected = $scope.elementsSelected().length;
                $rootScope.numberElementUnread = cacheCounters.unreadConversation(tools.currentLocation());
            }, true);
            $timeout($scope.actionsDelayed); // If we don't use the timeout, messages seems not available (to unselect for example)
            // I consider this trick like a bug in the angular application
        }, function(error) {
            $log.error(error);
        }));

        $scope.toolbarOffset();
        $rootScope.$watch('layoutMode', function() {
            $scope.toolbarOffset();
        });
    };

    $scope.toolbarOffset = function() {
        // This function calculates the width of the scrollbars (OS dependant) and tries to style the toolbar accordingly
        function getScrollBarWidth () {
            var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
            widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
            $outer.remove();
            return 100 - widthWithScroll;
        }
        $('#pm_columns #pm_toolbar').css('right', getScrollBarWidth());
    };

    $scope.mobileResponsive = function() {
        if ($window.outerWidth < 1024) {
            $rootScope.layoutMode = 'rows';
        }
    };

    $scope.startWatchingEvent = function() {
        angular.element($window).bind('resize', $scope.mobileResponsive);

        $scope.$on('refreshConversations', function() {
            $scope.refreshConversations();
        });

        $scope.$on('updateLabels', function() {
            $scope.updateLabels();
        });

        $scope.$on('unselectAllElements', function(event) {
            $scope.unselectAllElements();
        });

        $scope.$on('applyLabels', function(event, LabelID) {
            $scope.applyLabels(LabelID);
        });

        $scope.$on('move', function(event, name) {
            $scope.move(name);
        });

        $scope.$on('$destroy', $scope.stopWatchingEvent);
    };

    $scope.stopWatchingEvent = function() {
        preloadConversation.reset();
        angular.element($window).unbind('resize', $scope.mobileResponsive);
    };

    $scope.actionsDelayed = function() {
        $scope.unselectAllElements();
        $('#page').val($scope.page);
        $('#page').change(function(event) {
            $scope.goToPage();
        });

        if($rootScope.scrollPosition) {
            $('#content').scrollTop($rootScope.scrollPosition);
            $rootScope.scrollPosition = null;
        }
    };

    $scope.selectPage = function(page) {
        $scope.goToPage(page, page < $scope.page);
    };

    $scope.conversationCount = function() {
        var result;

        if(angular.isDefined($stateParams.filter) || $scope.mailbox === 'search') {
            result = $rootScope.Total;
        } else {
            switch($scope.mailbox) {
                case 'drafts':
                    result = cacheCounters.totalMessage(CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox]);
                    break;
                case 'label':
                    result = cacheCounters.totalConversation($stateParams.label);
                    break;
                default:
                    result = cacheCounters.totalConversation(CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox]);
                    break;
            }
        }

        return result;
    };

    $scope.makeDropdownPages = function() {
        var ddp = [];
        var ddp2 = [];
        var makeRangeCounter = 0;
        var count = $scope.conversationCount();

        for (var i = 0; i <= parseInt(count - 1); i++) {
            ddp[i] = i;
        }

        function makeRange(element, index, array) {
            if(index%CONSTANTS.MESSAGES_PER_PAGE === 0) {
                ddp2.push((index+1) + ' - ' + (index+CONSTANTS.MESSAGES_PER_PAGE));
                makeRangeCounter++;
            }
        }

        ddp.forEach(makeRange);

        return ddp2;
    };

    $scope.getConversationsParameters = function(mailbox) {
        var params = {};

        params.Page = ($stateParams.page || 1) - 1;

        if (angular.isDefined($stateParams.filter)) {
            params.Unread = +($stateParams.filter === 'unread'); // Convert Boolean to Integer
        }

        if (angular.isDefined($stateParams.sort)) {
            var sort = $stateParams.sort;
            var desc = sort.charAt(0) === '-';

            if (desc === true) {
                sort = sort.slice(1);
            }

            params.Sort = _.string.capitalize(sort);
            params.Desc = +desc;
        }

        if (mailbox === 'search') {
            params.Label = $stateParams.label;
            params.Keyword = $stateParams.words;
            params.To = $stateParams.to;
            params.From = $stateParams.from;
            params.Subject = $stateParams.subject;
            params.Begin = $stateParams.begin;
            params.End = $stateParams.end;
            params.Attachments = $stateParams.attachments;
        } else if(mailbox === 'label') {
            params.Label = $stateParams.label;
        } else {
            params.Label = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        }

        _.pick(params, _.identity);

        return params;
    };

    $scope.refreshConversations = function() {
        var deferred = $q.defer();
        var request = $scope.getConversationsParameters($scope.mailbox);
        var promise;
        var context = tools.cacheContext(request);

        if(['drafts', 'search'].indexOf(tools.currentMailbox()) !== -1) {
            promise = cache.queryMessages(request);
        } else {
            promise = cache.queryConversations(request);
        }

        promise.then(function(conversations) {
            $scope.conversations = conversations;
            deferred.resolve(conversations);
        }, function(error) {
            notify({message: 'Error during quering conversations', classes: 'notification-danger'}); // TODO translate
            $log.error(error);
        });

        if(context === false) {
            networkActivityTracker.track(promise);
        }

        return deferred.promise;
    };

    /**
     * Return if the current element is active
     * @param {Object} element
     * @return {Boolean}
     */
    $scope.active = function(element) {
        if(angular.isDefined($state.params.id)) {
            return $state.params.id === element.ConversationID || $state.params.id === element.ID;
        } else {
            return false;
        }
    };

    /**
     * Manage time displaying
     * @param {Object} conversation or message
     * @return {Integer}
     */
    $scope.time = function(element) {
        if(angular.isObject(element.Times)) {
            var loc = tools.currentLocation();

            return element.Times[loc];
        } else {
            return element.Time;
        }
    };

    /**
     * Update labels for the view
     */
    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    /**
     * Return style to color tag label
     * @param {String} id - label id
     * @return {Object} style
     */
    $scope.getColorLabel = function(id) {
        return {
            color: $scope.getLabel(id).Color,
            borderColor: $scope.getLabel(id).Color
        };
    };

    /**
     *
     * @return {}
     */
    $scope.start = function() {
        return ($scope.page - 1) * $scope.conversationsPerPage + 1;
    };

    /**
     *
     * @return {} end
     */
    $scope.end = function() {
        var end = $scope.start() + $scope.conversationsPerPage - 1;

        if (end > $scope.conversationCount()) {
            end = $scope.conversationCount();
        }

        return end;
    };

    /**
     * Return if all elements are selected
     * @return {Boolean}
     */
    $scope.allSelected = function() {
        if ($scope.conversations && $scope.conversations.length > 0) {
            return $scope.conversations.length === $scope.elementsSelected().length;
        } else {
            return false;
        }
    };

    /**
     * Select or unselect all elements
     */
    $scope.toggleAllSelected = function() {
        var status = $scope.allSelected();

        if(status === true) {
            $scope.unselectAllElements();
        } else {
            $scope.selectAllElements();
        }
    };

    /**
     * Select all elements
     */
    $scope.selectAllElements = function() {
        _.each($scope.conversations, function(conversation) {
            conversation.Selected = true;
        });
    };

    /**
     * Unselect all elements
     */
    $scope.unselectAllElements = function() {
        _.each($scope.conversations, function(conversations) {
            conversations.Selected = false;
        });
    };

    /**
     * Return [Element]
     * @return {Array}
     */
    $scope.elementsSelected = function() {
        return _.where($scope.conversations, {Selected: true});
    };

    /**
     * Return [IDs]
     * @return {Array}
     */
    $scope.idsSelected = function() {
        return _.map($scope.elementsSelected(), function(conversation) { return conversation.ID; });
    };

    /**
     * Mark conversations selected as read
     */
    $scope.read = function() {
        var ids = $scope.idsSelected();
        var elements = angular.copy($scope.elementsSelected());
        var events = [];
        var type = tools.typeList();

        // cache
        _.each(elements, function(element) {
            element.Selected = false;

            if(type === 'conversation') {
                element.NumUnread = 0;
                var messages = cache.queryMessagesCached(element.ID);

                if(messages.length > 0) {
                    _.each(messages, function(message) {
                        message.IsRead = 1;
                        events.push({Action: 3, ID: message.ID, Message: message});
                    });
                }

                events.push({Action: 3, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                var conversation = cache.getConversationCached(element.ConversationID);

                element.IsRead = 1;
                events.push({Action: 3, ID: element.ID, Message: element});

                if(angular.isDefined(conversation)) {
                    conversation.NumUnread--;
                    events.push({Action: 3, ID: conversation.ID, Conversation: conversation});
                }
            }
        });

        cache.events(events);

        // api
        if(type === 'conversation') {
            Conversation.read(ids);
        } else if (type === 'message') {
            Message.read({IDs: ids});
        }

        $scope.unselectAllElements();
    };

    /**
     * Mark conversations selected as unread
     */
    $scope.unread = function() {
        var ids = $scope.idsSelected();
        var elements = angular.copy($scope.elementsSelected());
        var events = [];
        var type = tools.typeList();

        // cache
        _.each(elements, function(element) {
            element.Selected = false;

            if(type === 'conversation') {
                var messages = cache.queryMessagesCached(element.ID);

                element.NumUnread = element.NumMessages;

                if(messages.length > 0) {
                    var last = _.last(messages); // Unread only the latest

                    last.IsRead = 0;
                    events.push({Action: 3, ID: last.ID, Message: last});
                }

                events.push({Action: 3, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                var conversation = cache.getConversationCached(element.ConversationID);

                element.IsRead = 0;
                events.push({Action: 3, ID: element.ID, Message: element});

                if(angular.isDefined(conversation)) {
                    conversation.NumUnread++;
                    events.push({Action: 3, ID: conversation.ID, Conversation: conversation});
                }
            }
        });

        cache.events(events);

        // api
        if(type === 'conversation') {
            Conversation.unread(ids);
        } else if (type === 'message') {
            Message.unread({IDs: ids});
        }

        $scope.unselectAllElements();
    };

    /**
     * Delete elements selected
     */
    $scope.delete = function() {
        var ids = $scope.idsSelected();
        var elements = angular.copy($scope.elementsSelected());
        var events = [];
        var type = tools.typeList();

        // cache
        _.each(elements, function(element) {
            if(type === 'conversation') {
                var messages = cache.queryMessagesCached(element.ID);

                $rootScope.$broadcast('deleteConversation', element.ID); // Close composer

                if(messages.length > 0) {
                    _.each(messages, function(message) {
                        events.push({Action: 0, ID: message.ID, Message: message});
                    });
                }

                events.push({Action: 0, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                events.push({Action: 0, ID: element.ID, Message: element});
            }
        });

        cache.events(events);

        // api
        if(type === 'conversation') {
            Conversation.delete(ids);
        } else if (type === 'message') {
            Message.delete({IDs: ids});
        }

        $scope.unselectAllElements();

        // Back to element list
        $scope.back();
    };

    /**
     * Move conversation to an other location
     * @param {String} mailbox
     */
    $scope.move = function(mailbox) {
        var ids = $scope.idsSelected();
        var elements = angular.copy($scope.elementsSelected());
        var events = [];
        var type = tools.typeList();
        var current = tools.currentLocation();

        // Cache
        _.each(elements, function(element) {
            element.Selected = false;
            element.LabelIDsRemoved = [current]; // Remove current location
            element.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]]; // Add new location

            if(type === 'conversation') {
                var messages = cache.queryMessagesCached(element.ID);

                if(messages.length > 0) {
                    _.each(messages, function(message) {
                        message.Selected = false;
                        message.LabelIDsRemoved = [current]; // Remove current location
                        message.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]]; // Add new location
                        events.push({Action: 3, ID: message.ID, Message: message});
                    });
                }

                events.push({Action: 3, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                events.push({Action: 3, ID: element.ID, Message: element});
            }
        });

        // Send events
        cache.events(events);

        // Request
        if(type === 'conversation') {
            Conversation[mailbox](ids);
        } else if (type === 'message') {
            Message[mailbox]({IDs: ids});
        }

        // Back to element list
        $scope.back();
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
     * Check if the current message is a draft
     * @param {Object} element
     * @return {Boolean}
     */
    $scope.draft = function(element) {
        return angular.isDefined(element.LabelIDs) && element.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts) !== -1;
    };

    /**
     * Close all label dropdown
     */
    $scope.closeLabels = function() {
        $('.pm_dropdown').removeClass('active');
    };

    /**
     * Complex method to apply labels on element selected
     * @param {Array} labels
     * @param {Boolean} alsoArchive
     * @return {Promise}
     */
    $scope.saveLabels = function(labels, alsoArchive) {
        var REMOVE = 0;
        var ADD = 1;
        var deferred = $q.defer();
        var ids = $scope.idsSelected();
        var promises = [];
        var elementsSelected = $scope.elementsSelected();
        var type = tools.typeList();
        var events = [];
        var current = tools.currentLocation();

        _.each(elementsSelected, function(element) {
            var copy = angular.copy(element);
            var toApply = _.map(_.filter(labels, function(label) {
                return label.Selected === true && angular.isArray(copy.LabelIDs) && copy.LabelIDs.indexOf(label.ID) === -1;
            }), function(label) {
                return label.ID;
            });
            var toRemove = _.map(_.filter(labels, function(label) {
                return label.Selected === false && angular.isArray(copy.LabelIDs) && copy.LabelIDs.indexOf(label.ID) !== -1;
            }), function(label) {
                return label.ID;
            });

            if(alsoArchive === true) {
                toApply.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive);
                toRemove = toRemove.push(current);
            }

            copy.LabelIDsAdded = toApply;
            copy.LabelIDsRemoved = toRemove;
            copy.Selected = false;

            if(type === 'conversation') {
                var messages = cache.queryMessagesCached(copy.ID);

                _.each(messages, function(message) {
                    message.LabelIDsAdded = toApply;
                    message.LabelIDsRemoved = toRemove;
                    events.push({Action: 3, ID: message.ID, Message: message});
                });

                events.push({Action: 3, ID: copy.ID, Conversation: copy});
            } else if (type === 'message') {
                events.push({Action: 3, ID: copy.ID, Message: copy});
            }

            _.each(toApply, function(labelID) {
                if(type === 'conversation') {
                    promises.push(Conversation.labels(labelID, ADD, ids));
                } else if(type === 'message') {
                    promises.push(Message.updateLabels(labelID, ADD, ids));
                }
            });

            _.each(toRemove, function(labelID) {
                if(type === 'conversation') {
                    promises.push(Conversation.labels(labelID, REMOVE, ids));
                } else if(type === 'message') {
                    promises.push(Message.updateLabels(labelID, REMOVE, ids));
                }
            });
        });

        cache.events(events);

        $q.all(promises).then(function(results) {
            if(alsoArchive === true) {
                deferred.resolve(Conversation.archive(ids));
            } else {
                $scope.unselectAllElements();
                deferred.resolve();
            }
        }, function(error) {
            error.message = $translate.instant('ERROR_DURING_THE_LABELS_REQUEST');
            deferred.reject(error);
        });

        // Close dropdown labels
        $scope.closeLabels();

        // Back to the current message list if we archive element selected
        if(alsoArchive === true) {
            $scope.back();
        }

        return deferred.promise;
    };

    /**
     * Emulate labels array for the drag and drop
     * @param {String} labelID
     */
    $scope.applyLabels = function(labelID) {
        var labels = [];

        _.each($scope.labels, function(label) {
            if(label.ID === labelID) {
                label.Selected = true;
            }

            labels.push(label);
        });

        $scope.saveLabels(labels, true);
    };

    /**
     * Switch to an other page
     * @param {Integer} page
     * @param {Boolean} scrollToBottom
     */
    $scope.goToPage = function(page, scrollToBottom) {
        var route = 'secured.' + $scope.mailbox + '.list';

        $rootScope.scrollToBottom = scrollToBottom === true;
        $scope.unselectAllElements();
        $scope.page = page;

        if (page > 0 && $scope.conversationCount() > ((page - 1) * $scope.conversationsPerPage)) {
            if (page === 1) {
                page = undefined;
            }

            $state.go(route, _.extend({}, $state.params, {
                page: page,
                id: undefined
            }));
        }
    };

    /**
     * Return conversations selected
     * @return {Array}
     */
    var elementsSelected = function() {
        return _.where($scope.conversations, {Selected: true});
    };

    /**
     * Toggle star
     * @param {Object} element - conversation or message
     */
    $scope.toggleStar = function(element) {
        if($scope.starred(element) === true) {
            $scope.unstar(element);
        } else {
            $scope.star(element);
        }
    };

    /**
     * Star conversation or message
     * @param {Object} element
     */
    $scope.star = function(element) {
        var events = [];
        var copy = angular.copy(element);
        var type = tools.typeList();

        copy.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];

        if(type === 'conversation') {
            var messages = cache.queryMessagesCached(copy.ID);

            // Generate message changes with event
            if(messages.length > 0) {
                _.each(messages, function(message) {
                    message.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
                    events.push({ID: message.ID, Action: 3, Message: message});
                });
            }

            // Generate conversation changes with event
            events.push({ID: copy.ID, Action: 3, Conversation: copy});

            // Send to cache manager
            cache.events(events);

            // Send request
            Conversation.star([copy.ID]);
        } else if(type === 'message') {
            // Generate message changes with event
            events.push({ID: copy.ID, Action: 3, Message: copy});

            // Send to cache manager
            cache.events(events);

            // Send request
            Message.star({IDs: [copy.ID]});
        }
    };

    /**
     * Unstar conversation or message
     * @param {Object} element
     */
    $scope.unstar = function(element) {
        var events = [];
        var copy = angular.copy(element);
        var type = tools.typeList();

        copy.LabelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];

        if(type === 'conversation') {
            var messages = cache.queryMessagesCached(copy.ID);

            // Generate message changes with event
            if(messages.length > 0) {
                _.each(messages, function(message) {
                    message.LabelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
                    events.push({ID: message.ID, Action: 3, Message: message});
                });
            }

            // Generate conversation changes with event
            events.push({ID: copy.ID, Action: 3, Conversation: copy});

            // Send to cache manager
            cache.events(events);
            // Send request
            Conversation.unstar([copy.ID]);
        } else if(type === 'message') {
            // Generate message changes with event
            events.push({ID: copy.ID, Action: 3, Message: copy});

            // Send to cache manager
            cache.events(events);

            // Send request
            Message.unstar({IDs: [copy.ID]});
        }
    };

    /**
     * Check in LabelIDs to see if the conversation or message is starred
     * @param {Object} element
     */
    $scope.starred = function(element) {
        if(element.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Return label object
     * @param {String} id
     */
    $scope.getLabel = function(id) {
        return _.findWhere(authentication.user.Labels, {ID: id});
    };

    /**
     * Return style for label element
     * @param {String} id
     */
    $scope.getStyleLabel = function(id) {
        return {
            color: $scope.getLabel(id).Color,
            borderColor: $scope.getLabel(id).Color
        };
    };

    /**
     * Go to label folder + reset parameters
     * @param {String} labelID
     */
    $scope.goToLabel = function(labelID) {
        var params = {page: undefined, filter: undefined, sort: undefined, label: labelID};

        $state.go('secured.label.list', params);
    };

    /**
     * On click on a conversation
     * @param {Object} element - Conversation or Message
     */
    $scope.click = function(element) {
        var type = tools.typeList();
        var id;

        delete $rootScope.openMessage;
        // Save scroll position
        $rootScope.scrollPosition = $('#content').scrollTop();
        // Unselect all elements
        $scope.unselectAllElements();
        // Open conversation
        if(type === 'conversation') {
            id = element.ID;
        } else if (type === 'message') {
            id = element.ConversationID;
            $rootScope.openMessage = [element.ID];
        }

        $state.go('secured.' + $scope.mailbox + '.list.view', { id: id }, {reload: id === $state.params.id});
    };

    /**
     * On select a conversation
     * @param {Object} event
     * @param {Object} conversation
     */
    $scope.select = function(event, conversation) {
        if(!lastChecked) {
            lastChecked = conversation;
        } else {
            if (event.shiftKey) {
                var start = _.indexOf($scope.conversations, conversation);
                var end = _.indexOf($scope.conversations, lastChecked);

                _.each($scope.conversations.slice(Math.min(start, end), Math.max(start, end) + 1), function(conversation) {
                    conversation.Selected = lastChecked.Selected;
                });
            }

            lastChecked = conversation;
        }
    };

    /**
     * Swipe gesture for a message
     * @param {Object} event
     * @param {Object} conversation
     */
    $scope.swipeLeft = function(event, conversation) {
        conversation.dumpstered = true;
    };

    /**
     * Swipe gesture for a message
     * @param {Object} event
     * @param {Object} conversation
     */
    $scope.swipeRight = function(event, conversation) {
        conversation.spamified = true;
    };

    /**
     * Filter current list
     * @param {String}
     */
    $scope.filterBy = function(status) {
        $state.go($state.$current.name, _.extend({}, $state.params, {
            filter: status,
            page: undefined
        }));
    };

    /**
     * Clear current filter
     */
    $scope.clearFilter = function() {
        $state.go($state.$current.name, _.extend({}, $state.params, {
            filter: undefined,
            page: undefined
        }));
    };

    /**
     * Order the list by a specific parameter
     * @param {String} criterion
     */
    $scope.orderBy = function(criterion) {
        if(criterion === '-date') {
            criterion = undefined;
        }

        $state.go($state.$current.name, _.extend({}, $state.params, {
            sort: criterion,
            page: undefined
        }));
    };

    /**
     * Empty specific location
     * @param {String} mailbox
     */
    $scope.empty = function(mailbox) {
        var title = $translate.instant('CONFIRMATION');
        var message = $translate.instant('ARE_YOU_SURE?') + ' ' + $translate.instant('THIS_CANNOT_BE_UNDONE.');
        var promise;

        if(['drafts', 'spam', 'trash'].indexOf(mailbox) !== -1) {
            confirmModal.activate({
                params: {
                    title: title,
                    message: message,
                    confirm: function() {
                        if (mailbox === 'drafts') {
                            promise = Message.emptyDraft().$promise;
                        } else if (mailbox === 'spam') {
                            promise = Message.emptySpam().$promise;
                        } else if (mailbox === 'trash') {
                            promise = Message.emptyTrash().$promise;
                        }

                        promise.then(function(result) {
                            // Generate event to empty folder
                            cacheCounters.empty(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                            cache.empty(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                            // Close modal
                            confirmModal.deactivate();
                            // Notify user
                            notify({message: $translate.instant('FOLDER_EMPTIED'), classes: 'notification-success'});
                        }, function(error) {
                            notify({message: 'Error during the empty request', classes: 'notification-danger'});
                            $log.error(error);
                        });
                    },
                    cancel: function() {
                        confirmModal.deactivate();
                    }
                }
            });
        }
    };

    // Call initialization
    $scope.initialization();
});
