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
    cacheMessages,
    preloadMessage,
    confirmModal,
    cacheCounters,
    networkActivityTracker,
    notify
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
        $scope.refreshConversations().then(function() {
            $scope.$watch('conversations', function(newValue, oldValue) {
                preloadMessage.set(newValue);
                $rootScope.numberSelectedMessages = $scope.selectedMessages().length;
            }, true);
            $timeout($scope.actionsDelayed); // If we don't use the timeout, messages seems not available (to unselect for example)
            // I consider this trick like a bug in the angular application
        }, function(error) {
            $log.error(error);
        });
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

        $scope.$on('refreshConversationsCache', function(){
            $scope.refreshConversationsCache();
        });

        $scope.$on('unactiveConversations', function() {
            $scope.unactiveConversations();
        });

        $scope.$on('updateLabels', function() {
            $scope.updateLabels();
        });

        $scope.$on('goToFolder', function(event) {
            $scope.unselectAllMessages();
        });

        $scope.$on('unselectAllMessages', function(event) {
            $scope.unselectAllMessages();
        });

        $scope.$on('discardDraft', function(event, id) {
            $scope.discardDraft(id);
        });

        $scope.$on('applyLabels', function(event, LabelID) {
            $scope.applyLabels(LabelID);
        });

        $scope.$on('moveMessagesTo', function(event, name) {
            $scope.moveMessagesTo(name);
        });

        $scope.$on('activeConversation', function(event, id) {
            $scope.activeConversation(id);
        });

        $scope.$on('starMessages', function(event) {
            var ids = $scope.selectedIds();
            var promise;

            _.each($scope.selectedMessages(), function(message) { message.Starred = 1; });
            promise = Message.star({IDs: ids}).$promise;
            networkActivityTracker.track(promise);
            $scope.unselectAllMessages();
        });

        $scope.$on('$destroy', $scope.stopWatchingEvent);
    };

    $scope.stopWatchingEvent = function() {
        preloadMessage.reset();
        angular.element($window).unbind('resize', $scope.mobileResponsive);
    };

    $scope.actionsDelayed = function() {
        $scope.unselectAllMessages();
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

    $scope.messageCount = function() {
        var result;

        if(angular.isDefined($stateParams.filter) || $state.is('secured.search')) {
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
        var count = $scope.messageCount();

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

        cacheMessages.queryConversations(request).then(function(messages) {
            $scope.conversations = messages;
            deferred.resolve(messages);
        }, function(error) {
            notify({message: 'Error during quering messages', classes: 'notification-danger'});
            $log.error(error);
        });

        return deferred.promise;
    };

    $scope.refreshConversationsCache = function () {
        var request = $scope.getConversationsParameters($scope.mailbox);
        var cache = cacheMessages.fromCache(request);

        if(cache !== false) {
            $scope.conversations = cache;
        }
    };

    $scope.unactiveConversations = function() {
        _.each($scope.conversations, function(message) {
            message.Active = false;
        });
    };

    $scope.activeConversation = function(id) {
        _.each($scope.conversations, function(message) {
            message.Active = angular.isDefined(id) && message.ID === id;
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
        var end;

        end = $scope.start() + $scope.conversationsPerPage - 1;

        if (end > $scope.messageCount()) {
            end = $scope.messageCount();
        }

        return end;
    };

    $scope.hasNextPage = function() {
        return $scope.messageCount() > ($scope.page * $scope.conversationsPerPage);
    };

    $scope.allSelected = function() {
        var status = true;

        if ($scope.conversations && $scope.conversations.length > 0) {
            _.forEach($scope.conversations, function(message) {
                if (!!!message.Selected) {
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
            $scope.unselectAllMessages();
        } else {
            $scope.selectAllMessages();
        }
    };

    $scope.selectAllMessages = function() {
        _.forEach($scope.conversations, function(message) {
            message.Selected = true;
        });

        $scope.allSelectedCheckbox = true;
    };

    $scope.unselectAllMessages = function() {
        _.forEach($scope.conversations, function(message) {
            message.Selected = false;
        });

        $scope.allSelectedCheckbox = false;
    };

    $scope.selectedMessages = function() {
        return _.select($scope.conversations, function(message) {
            return message.Selected === true;
        });
    };

    $scope.selectedIds = function() {
        return _.map($scope.selectedMessages(), function(message) { return message.ID; });
    };

    $scope.selectedMessagesWithReadStatus = function(bool) {
        return _.select($scope.selectedMessages(), function(message) {
            return message.IsRead === +bool;
        });
    };

    $scope.setMessagesReadStatus = function(status) {
        var messages = $scope.selectedMessagesWithReadStatus(!status);
        var ids = _.map(messages, function(message) { return message.ID; });
        var promise = (status) ? Message.read({IDs: ids}).$promise : Message.unread({IDs: ids}).$promise;
        var events = [];

        _.each(messages, function(message) {
            var newMessage = {};

            newMessage.ID = message.ID;
            newMessage.IsRead = +status;
            newMessage.Time = message.Time;
            events.push({Action: 3, ID: newMessage.ID, Message: newMessage});
        });

        cacheMessages.events(events);

        $scope.unselectAllMessages();
    };

    $scope.discardDraft = function(id) {
        var movedMessages = [];
        var message = cacheMessages.get(id).then(function(message) {
            Message.trash({IDs: [id]}).$promise.then(function(result) {

                movedMessages.push({
                    LabelIDs: message.LabelIDs,
                    OldLocation: message.Location,
                    IsRead: message.IsRead,
                    Location: CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                    Starred: message.Starred
                });

                cacheMessages.events([{
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

    $scope.moveMessagesTo = function(mailbox) {
        var deferred = $q.defer();
        var ids = $scope.selectedIds();
        var inDelete = mailbox === 'delete';
        var promise = (inDelete) ? Message.delete({IDs: ids}).$promise : Message[mailbox]({IDs: ids}).$promise;
        var events = [];
        var movedMessages = [];

        _.forEach($scope.selectedMessages(), function (message) {
            message.Selected = false;

            var event = {
                ID: message.ID,
                Message: angular.copy(message)
            };

            if(inDelete) {
                event.Action = 0; // DELETE
            } else {
                event.Action = 3; // UPDATE_FLAG
                event.Message.Location = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
                event.Message.Time = message.Time;
            }

            events.push(event);

            if(inDelete) {
                $rootScope.$broadcast('deleteMessage', message.ID);
            }
        });

        if(events.length > 0) {
            cacheMessages.events(events);
        }

        $scope.unselectAllMessages();

        var promiseSuccess = function(result) {
            if(inDelete) {
                if(ids.length > 1) {
                    notify({message: $translate.instant('MESSAGES_DELETED'), classes: 'notification-success'});
                } else {
                    notify({message: $translate.instant('MESSAGE_DELETED'), classes: 'notification-success'});
                }
            }

            deferred.resolve();
        };

        var promiseError = function(error) {
            error.message = 'Error during the move request';
            deferred.reject(error);
        };

        if ($scope.conversations.length === 0) {
            networkActivityTracker.track(promise.then(promiseSuccess, promiseError));
        } else {
            promise.then(promiseSuccess, promiseError);
        }

        return deferred.promise;
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
        var messageIDs = $scope.selectedIds();
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];
        var tooManyLabels = false;
        var selectedMessages = $scope.selectedMessages();

        // Detect if a message will have too many labels
        _.each(selectedMessages, function(message) {
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

                _.each(selectedMessages, function(message) {
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

                cacheMessages.events(events);

                if(alsoArchive === true) {
                    deferred.resolve($scope.moveMessagesTo('archive'));
                } else {
                    $scope.unselectAllMessages();
                    deferred.resolve();
                }

                $scope.unselectAllLabels();
            }, function(error) {
                error.message = 'Error during the labels request';
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
        $scope.unselectAllMessages();
        $scope.page = page;
        if (page > 0 && $scope.messageCount() > ((page - 1) * $scope.conversationsPerPage)) {
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
    var conversationsSelected = function() {
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

    $scope.toggleStar = function(conversation) {
        if($scope.starred(conversation)) {
            Conversation.unstar(conversation.ID);
        } else {
            Conversation.star(conversation.ID);
        }

        // TODO Generate event
    };

    $scope.starred = function(conversation) {
        if(angular.isDefined(conversation.LabelIDs) && conversation.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1) {
            return true;
        } else {
            return false;
        }
    };

    $scope.getLabel = function(id) {
        var label = _.findWhere($scope.labels, {ID: id});

        if(angular.isDefined(label)) {
            return label;
        } else {
            return {};
        }
    };

    $scope.getStyleLabel = function(id) {
        return {
            color: $scope.getLabel(id).Color,
            borderColor: $scope.getLabel(id).Color
        };
    };

    /**
     * Move conversation to an other location
     */
    $scope.moveTo = function(location) {
        if(location === 'delete') {

        } else {

        }
    };

    /**
     * Delete conversation
     */
    $scope.delete = function() {
        Conversation.delete();
    };

    /**
     * On click on a conversation
     */
    $scope.click = function(conversation) {
        // Save scroll position
        $rootScope.scrollPosition = $('#content').scrollTop();
        // Open conversation
        $state.go('secured.' + $scope.mailbox + '.list.view', { id: conversation.ID });

        //     networkActivityTracker.track(
        //         Message.get({id: message.ID}).$promise.then(
        //             function(m) {
        //                 m.decryptBody(m.Body, m.Time).then(function(body) {
        //                     m.Body = body;
        //
        //                     if(m.Attachments && m.Attachments.length > 0) {
        //                         m.attachmentsToggle = true;
        //                     }
        //
        //                     $rootScope.$broadcast('loadMessage', m);
        //                 }, function(error) {
        //                     notify({message: 'Error during the decryption of the message', classes: 'notification-danger'});
        //                     $log.error(error); // TODO send to back-end
        //                 });
        //             }, function(error) {
        //                 notify({message: 'Error during the getting message', classes: 'notification-danger'});
        //                 $log.error(error); // TODO send to back-end
        //             }
        //         )
        //     );

    };

    /**
     * On select a conversation
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

    $scope.filterBy = function(status) {
        $state.go($state.current.name, _.extend({}, $state.params, {
            filter: status,
            page: undefined
        }));
    };

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
        var title = "Confirmation";
        var message = "Are you sure? This cannot be undone.";
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
                            cacheCounters.empty(location);
                            $rootScope.$broadcast('refreshCounters');
                            $rootScope.$broadcast('refreshConversationsCache');
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
