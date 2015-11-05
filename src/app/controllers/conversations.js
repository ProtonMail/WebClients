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

    $scope.initialization = function() {
        // Variables
        $scope.mailbox = $state.current.name.replace('secured.', '').replace('.list', '').replace('.view', '');
        $scope.conversationsPerPage = authentication.user.NumMessagePerPage;
        $scope.labels = authentication.user.Labels;
        $scope.messageButtons = authentication.user.MessageButtons;
        $scope.Math = window.Math;
        $scope.CONSTANTS = CONSTANTS;
        $scope.selectedFilter = $stateParams.filter;
        $scope.selectedOrder = $stateParams.sort || "-date";
        $scope.page = parseInt($stateParams.page || 1);
        $scope.allSelectedCheckbox = false;
        $scope.startWatchingEvent();
        $scope.mobileResponsive();
        networkActivityTracker.track($scope.refreshConversations().then(function() {
            $scope.$watch('conversations', function(newValue, oldValue) {
                preloadConversation.set(newValue);
                $rootScope.numberSelectedMessages = $scope.elementsSelected().length;
            }, true);
            $timeout($scope.actionsDelayed); // If we don't use the timeout, messages seems not available (to unselect for example)
            // I consider this trick like a bug in the angular application
        }, function(error) {
            $log.error(error);
        }));
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

        $scope.$on('unactiveConversations', function() {
            $scope.unactiveConversations();
        });

        $scope.$on('updateLabels', function() {
            $scope.updateLabels();
        });

        $scope.$on('goToFolder', function(event) {
            $scope.unselectAllConversations();
        });

        $scope.$on('unselectAllConversations', function(event) {
            $scope.unselectAllConversations();
        });

        $scope.$on('discardDraft', function(event, id) {
            $scope.discardDraft(id);
        });

        $scope.$on('applyLabels', function(event, LabelID) {
            $scope.applyLabels(LabelID);
        });

        $scope.$on('move', function(event, name) {
            $scope.move(name);
        });

        $scope.$on('activeConversation', function(event, id) {
            $scope.activeConversation(id);
        });

        $scope.$on('starMessages', function(event) {
            var ids = $scope.idsSelected();
            var promise;

            _.each($scope.elementsSelected(), function(message) { message.Starred = 1; });
            promise = Message.star({IDs: ids}).$promise;
            networkActivityTracker.track(promise);
            $scope.unselectAllConversations();
        });

        $scope.$on('$destroy', $scope.stopWatchingEvent);
    };

    $scope.stopWatchingEvent = function() {
        preloadConversation.reset();
        angular.element($window).unbind('resize', $scope.mobileResponsive);
    };

    $scope.actionsDelayed = function() {
        $scope.unselectAllConversations();
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

        if(angular.isDefined($stateParams.filter) || $state.is('secured.search') || $state.is('secured.drafts') || $state.is('secured.sent')) {
            result = $rootScope.Total;
        } else {
            switch($scope.mailbox) {
                case 'label':
                    result = cacheCounters.total($stateParams.label);
                    break;
                default:
                    result = cacheCounters.total(CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox]);
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

        if ($stateParams.filter) {
            params.Unread = +($stateParams.filter === 'unread');
        }

        if ($stateParams.sort) {
            var sort = $stateParams.sort;
            var desc = _.string.startsWith(sort, "-");

            if (desc) {
                sort = sort.slice(1);
            }

            params.Sort = _.string.capitalize(sort);
            params.Desc = +desc;
        }

        if (mailbox === 'search') {
            params.Location = $stateParams.location;
            params.Keyword = $stateParams.words;
            params.To = $stateParams.to;
            params.From = $stateParams.from;
            params.Subject = $stateParams.subject;
            params.Begin = $stateParams.begin;
            params.End = $stateParams.end;
            params.Attachments = $stateParams.attachments;
            params.Starred = $stateParams.starred;
            params.Label = $stateParams.label;
        } else if(mailbox === 'label') {
            params.Label = $stateParams.label;
        } else {
            params.Location = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        }

        if(parseInt(params.Location) === CONSTANTS.MAILBOX_IDENTIFIERS.starred) {
            params.Starred = 1;
            delete params.Location;
        }

        _.pick(params, _.identity);

        return params;
    };

    $scope.refreshConversations = function() {
        var deferred = $q.defer();
        var request = $scope.getConversationsParameters($scope.mailbox);
        var promise;

        if(['sent', 'drafts', 'search'].indexOf(tools.currentMailbox()) !== -1) {
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

        return deferred.promise;
    };

    $scope.unactiveConversations = function() {
        _.each($scope.conversations, function(conversation) {
            conversation.Active = false;
        });
    };

    $scope.activeConversation = function(id) {
        _.each($scope.conversations, function(conversation) {
            conversation.Active = angular.isDefined(id) && conversation.ID === id;
        });
    };

    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    $scope.senderIsMe = function(message) {
        var result = false;

        for( var i = 0, len = $scope.user.Addresses.length; i < len; i++ ) {
            if( $scope.user.Addresses[i].Email === message.Sender.Address ) {
                result = true;
            }
        }

        return result;
    };

    $scope.getColorLabel = function(id) {
        return {
            color: $scope.getLabel(id).Color,
            borderColor: $scope.getLabel(id).Color
        };
    };

    $scope.start = function() {
        return ($scope.page - 1) * $scope.conversationsPerPage + 1;
    };

    $scope.end = function() {
        var end = $scope.start() + $scope.conversationsPerPage - 1;

        if (end > $scope.conversationCount()) {
            end = $scope.conversationCount();
        }

        return end;
    };

    $scope.hasNextPage = function() {
        return $scope.conversationCount() > ($scope.page * $scope.conversationsPerPage);
    };

    $scope.allSelected = function() {
        var status = true;

        if ($scope.conversations && $scope.conversations.length > 0) {
            _.forEach($scope.conversations, function(conversation) {
                if (!!!conversation.Selected) {
                    status = false;
                }
            });
        } else {
            status = false;
        }

        $scope.allSelectedCheckbox = status;
    };

    $scope.toggleAllSelected = function() {
        var status = $scope.allSelectedCheckbox;

        if(status === true) {
            $scope.unselectAllConversations();
        } else {
            $scope.selectAllMessages();
        }
    };

    $scope.selectAllMessages = function() {
        _.each($scope.conversations, function(conversation) {
            conversation.Selected = true;
        });

        $scope.allSelectedCheckbox = true;
    };

    $scope.unselectAllConversations = function() {
        _.each($scope.conversations, function(conversations) {
            conversations.Selected = false;
        });

        $scope.allSelectedCheckbox = false;
    };

    $scope.elementsSelected = function() {
        return _.where($scope.conversations, {Selected: true});
    };

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
            element.NumUnread = 0;

            if(type === 'conversation') {
                events.push({Action: 3, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                events.push({Action: 3, ID: element.ID, Message: element});
            }
        });

        cache.events(events, type);

        // api
        if(type === 'conversation') {
            Conversation.read(ids);
        } else if (type === 'message') {
            Message.read({IDs: ids});
        }

        $scope.unselectAllConversations();
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
            element.NumUnread = 1;

            if(type === 'conversation') {
                events.push({Action: 3, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                events.push({Action: 3, ID: element.ID, Message: element});
            }
        });

        cache.events(events, type);

        // api
        if(type === 'conversation') {
            Conversation.unread(ids);
        } else if (type === 'message') {
            Message.unread({IDs: ids});
        }

        $scope.unselectAllConversations();
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
                events.push({Action: 0, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                events.push({Action: 0, ID: element.ID, Message: element});
                // Manage the case where the message is open in the composer
                $rootScope.$broadcast('deleteMessage', element.ID);
            }
        });

        cache.events(events, type);

        // api
        if(type === 'conversation') {
            Conversation.delete(ids);
        } else if (type === 'message') {
            Message.delete({IDs: ids});
        }

        $scope.unselectAllConversations();
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

        // cache
        _.each(elements, function(element) {
            element.LabelIDs = _.without(element.LabelIDs, tools.currentLocation()); // remove current location
            element.LabelIDs.push(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox].toString()); // Add new location

            if(type === 'conversation') {
                events.push({Action: 3, ID: element.ID, Conversation: element});
            } else if(type === 'message') {
                events.push({Action: 3, ID: element.ID, Message: element});
            }
        });

        cache.events(events, type);

        // api
        if(type === 'conversation') {
            Conversation[mailbox](ids);
        } else if (type === 'message') {
            Message[mailbox]({IDs: ids});
        }

        $scope.unselectAllConversations();
    };

    // PREVIOUS .move function
    // $scope.move = function(mailbox) {
    //     var deferred = $q.defer();
    //     var ids = $scope.idsSelected();
    //     var inDelete = mailbox === 'delete';
    //     var promise = (inDelete) ? Message.delete({IDs: ids}).$promise : Message[mailbox]({IDs: ids}).$promise;
    //     var events = [];
    //     var movedMessages = [];
    //
    //     _.forEach($scope.elementsSelected(), function (message) {
    //         message.Selected = false;
    //
    //         var event = {
    //             ID: message.ID,
    //             Message: angular.copy(message)
    //         };
    //
    //         if(inDelete) {
    //             event.Action = 0; // DELETE
    //         } else {
    //             event.Action = 3; // UPDATE_FLAG
    //             event.Message.Location = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
    //             event.Message.Time = message.Time;
    //         }
    //
    //         events.push(event);
    //
    //         if(inDelete) {
    //             $rootScope.$broadcast('deleteMessage', message.ID);
    //         }
    //     });
    //
    //     if(events.length > 0) {
    //         cache.events(events);
    //     }
    //
    //     $scope.unselectAllConversations();
    //
    //     var promiseSuccess = function(result) {
    //         if(inDelete) {
    //             if(ids.length > 1) {
    //                 notify({message: $translate.instant('MESSAGES_DELETED'), classes: 'notification-success'});
    //             } else {
    //                 notify({message: $translate.instant('MESSAGE_DELETED'), classes: 'notification-success'});
    //             }
    //         }
    //
    //         deferred.resolve();
    //     };
    //
    //     var promiseError = function(error) {
    //         error.message = 'Error during the move request';
    //         deferred.reject(error);
    //     };
    //
    //     if ($scope.conversations.length === 0) {
    //         networkActivityTracker.track(promise.then(promiseSuccess, promiseError));
    //     } else {
    //         promise.then(promiseSuccess, promiseError);
    //     }
    //
    //     return deferred.promise;
    // };

    $scope.discardDraft = function(id) {
        var movedMessages = [];
        var message = cache.getMessage(id).then(function(message) {
            Message.trash({IDs: [id]}).$promise.then(function(result) {
                movedMessages.push({
                    LabelIDs: message.LabelIDs,
                    OldLocation: message.Location,
                    IsRead: message.IsRead,
                    Location: CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                    Starred: message.Starred
                });

                cache.events([{
                    Action: 3,
                    ID: message.ID,
                    Message: {
                        ID: message.ID,
                        Location: CONSTANTS.MAILBOX_IDENTIFIERS.trash
                    }
                }]);

                $scope.conversations = _.without($scope.conversations, message);
            }, function(error) {
                notify({message: 'Error during the trash request', classes: 'notification-danger'});
                $log.error(error);
            });

        }, function(error) {
            notify({message: 'Error during the getting message from the cache', classes: 'notification-danger'});
            $log.error(error);
        });
    };

    $scope.unselectAllLabels = function() {
        _.forEach($scope.labels, function(label) {
            label.Selected = false;
        });
    };

    $scope.closeLabels = function() {
        $scope.unselectAllLabels();
        $('[data-toggle="dropdown"]').parent().removeClass('open');
    };

    $scope.saveLabels = function(labels, alsoArchive) {
        var deferred = $q.defer();
        var messageIDs = $scope.idsSelected();
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];
        var tooManyLabels = false;
        var elementsSelected = $scope.elementsSelected();

        // Detect if a message will have too many labels
        _.each(elementsSelected, function(message) {
            if(_.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove).length > 5) {
                tooManyLabels = true;
            }
        });

        if(tooManyLabels) {
            deferred.reject(new Error($translate.instant('TOO_MANY_LABELS_ON_MESSAGE')));
        } else {
            _.each(toApply, function(labelID) {
                promises.push(Label.apply({id: labelID, MessageIDs: messageIDs}).$promise);
            });

            _.each(toRemove, function(labelID) {
                promises.push(Label.remove({id: labelID, MessageIDs: messageIDs}).$promise);
            });

            $q.all(promises).then(function(results) {
                var events = [];

                _.each(elementsSelected, function(message) {
                    var newMessage = angular.copy(message);

                    if(alsoArchive === true) {
                        newMessage.Location = CONSTANTS.MAILBOX_IDENTIFIERS.archive;
                    }

                    newMessage.LabelIDs = _.uniq(newMessage.LabelIDs.concat(toApply));
                    newMessage.LabelIDs = _.difference(newMessage.LabelIDs, toRemove);

                    events.push({
                        Action: 3, // UPDATE_FLAG
                        ID: newMessage.ID,
                        Message: newMessage
                    });
                });

                cache.events(events);

                if(alsoArchive === true) {
                    deferred.resolve($scope.move('archive'));
                } else {
                    $scope.unselectAllConversations();
                    deferred.resolve();
                }

                $scope.unselectAllLabels();
            }, function(error) {
                error.message = $translate.instant('ERROR_DURING_THE_LABELS_REQUEST');
                deferred.reject(error);
            });

            networkActivityTracker.track(deferred.promise);
        }

        return deferred.promise;
    };

    $scope.applyLabels = function(LabelID) {
        var labels = [];

        _.each($scope.labels, function(label) {
            if(label.ID === LabelID) {
                label.Selected = true;
            }

            labels.push(label);
        });

        $scope.saveLabels(labels, true);
    };

    $scope.goToPage = function(page, scrollToBottom) {
        $rootScope.scrollToBottom = scrollToBottom === true;
        $scope.unselectAllConversations();
        $scope.page = page;
        if (page > 0 && $scope.conversationCount() > ((page - 1) * $scope.conversationsPerPage)) {
            if (page === 1) {
                page = undefined;
            }

            $state.go($state.current.name, _.extend({}, $state.params, {
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
     * Return conversations id selected
     * @return {Array}
     */
    var idsSelected = function() {

    };

    $scope.showTo = function(message) {
        return (
            $scope.senderIsMe(message) &&
            (
                !$state.is('secured.inbox.list') &&
                !$state.is('secured.archive.list')  &&
                !$state.is('secured.spam.list')  &&
                !$state.is('secured.trash.list')
            )
        ) ? true : false;
    };

    $scope.showFrom = function(message) {
        return ((
                !$state.is('secured.inbox.list') &&
                !$state.is('secured.drafts.list')  &&
                !$state.is('secured.archive.list') &&
                !$state.is('secured.sent.list') &&
                !$state.is('secured.spam.list') &&
                !$state.is('secured.trash.list')
            )
        ) ? true : false;
    };

    $scope.star = function(conversation) {
        var events = [];
        var copy = angular.copy(conversation);
        var type = tools.typeList();

        if($scope.starred(copy)) {
            copy.LabelIDs.push(CONSTANTS.MAILBOX_IDENTIFIERS.starred.toString());
            Conversation.unstar([copy.ID]);
        } else {
            copy.LabelIDs = _.without(copy.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.starred.toString());
            Conversation.star([copy.ID]);
        }

        events.push({ID: copy.ID, Action: 2, Conversation: copy});
        cache.events(events, type);
    };

    /**
     * Check in LabelIDs to see if the conversation or message is starred
     */
    $scope.starred = function(element) {
        if(element.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred.toString()) !== -1) {
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
     * On click on a conversation
     * @param {Object} element - Conversation or Message
     */
    $scope.click = function(element) {
        var type = tools.typeList();
        // Save scroll position
        $rootScope.scrollPosition = $('#content').scrollTop();
        // Open conversation
        if(type === 'conversation') {
            $state.go('secured.' + $scope.mailbox + '.list.view', { id: element.ID });
        } else if (type === 'message') {
            $rootScope.openMessage = element.ID;
            $state.go('secured.' + $scope.mailbox + '.list.view', { id: element.ConversationID });
        }
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
            if (event, event.shiftKey) {
                var start = _.indexOf($scope.conversations, conversation);
                var end = _.indexOf($scope.conversations, lastChecked);

                _.each($scope.conversations.slice(Math.min(start, end), Math.max(start, end) + 1), function(conversation) {
                    conversation.Selected = true;
                });
            }

            lastChecked = conversation;
        }

        // $scope.allSelected();
    };

    /**
     * Filter current list
     * @param {String}
     */
    $scope.filterBy = function(status) {
        $state.go($state.current.name, _.extend({}, $state.params, {
            filter: status,
            page: undefined
        }));
    };

    /**
     * Clear current filter
     */
    $scope.clearFilter = function() {
        $state.go($state.current.name, _.extend({}, $state.params, {
            filter: undefined,
            page: undefined
        }));
    };

    $scope.orderBy = function(criterion) {
        $state.go($state.current.name, _.extend({}, $state.params, {
            sort: criterion === '-date' ? undefined : criterion,
            page: undefined
        }));
    };

    $scope.emptyFolder = function(location) {
        var title = $translate.instant('CONFIRMATION');
        var message = $translate.instant('ARE_YOU_SURE?') + ' ' + $translate.instant('THIS_CANNOT_BE_UNDONE.');
        var promise;

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    if (parseInt(location) === CONSTANTS.MAILBOX_IDENTIFIERS.drafts) {
                        promise = Message.emptyDraft().$promise;
                    } else if (parseInt(location) === CONSTANTS.MAILBOX_IDENTIFIERS.spam) {
                        promise = Message.emptySpam().$promise;
                    } else if (parseInt(location) === CONSTANTS.MAILBOX_IDENTIFIERS.trash) {
                        promise = Message.emptyTrash().$promise;
                    }

                    promise.then(
                        function(result) {
                            cache.clearLocation(location);
                            cacheCounters.empty(location);
                            $rootScope.$broadcast('refreshCounters');
                            $rootScope.$broadcast('refreshConversations');
                            notify({message: $translate.instant('FOLDER_EMPTIED'), classes: 'notification-success'});
                        },
                        function(error) {
                            notify({message: 'Error during the empty request', classes: 'notification-danger'});
                            $log.error(error);
                        }
                    );

                    confirmModal.deactivate();
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.initialization();
});
