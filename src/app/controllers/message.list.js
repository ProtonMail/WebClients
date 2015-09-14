angular.module("proton.controllers.Messages.List", ["proton.constants"])

.controller("MessageListController", function(
    $q,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    $filter,
    CONSTANTS,
    Message,
    Label,
    authentication,
    confirmModal,
    messageCache,
    messageCounts,
    networkActivityTracker,
    notify
) {
    var lastChecked = null;

    $scope.initialization = function() {
        // Variables
        $scope.mailbox = $state.current.data.mailbox;
        $scope.messagesPerPage = $scope.user.NumMessagePerPage;
        $scope.labels = authentication.user.Labels;
        $scope.messageButtons = authentication.user.MessageButtons;
        $scope.Math = window.Math;
        $scope.CONSTANTS = CONSTANTS;
        $scope.selectedFilter = $stateParams.filter;
        $scope.selectedOrder = $stateParams.sort || "-date";
        $scope.page = parseInt($stateParams.page || 1);
        $scope.draggableOptions = {
            appendTo: "html",
            delay: 100,
            cancel: ".starLink",
            cursorAt: {left: 0, top: 0},
            cursor: "move",
            helper: function(event) {
                return $('<span class="well well-sm draggable" id="draggableMailsHelper"><i class="fa fa-envelope-o"></i> <strong><b></b> Mails</strong></span>');
            },
            containment: "document"
        };

        $rootScope.$broadcast('updatePageName');
        $scope.startWatchingEvent();
        $scope.refreshMessagesCache().then(function() {
            messageCache.watchScope($scope, "messages");
            $scope.$watch('messages', function() {
                $rootScope.numberSelectedMessages = $scope.selectedMessages().length;
            }, true);
            $timeout($scope.actionsDelayed); // If we don't use the timeout, messages seems not available (to unselect for example)
            // I consider this trick like a bug in the angular application
        }, function(error) {
            $log.error(error);
        });
    };

    $scope.startWatchingEvent = function() {
        $scope.$on('refreshMessages', function(event, silently, empty) {
            $scope.refreshMessages(silently, empty);
        });

        $scope.$on('refreshMessagesCache', function(){
            $scope.refreshMessagesCache();
        });

        $scope.$on('updateLabels', function() {
            $scope.updateLabels();
        });

        $scope.$on('goToFolder', function(event) {
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

    $scope.messageCount = function() {
        if(angular.isDefined($stateParams.filter) || $state.is('secured.search')) {
            return $rootScope.Total;
        } else {
            if ($scope.mailbox === 'label') {
                if ($rootScope.messageTotals) {
                    if($rootScope.messageTotals.Labels[$stateParams.label]) {
                        return $rootScope.messageTotals.Labels[$stateParams.label];
                    } else {
                        return 0;
                    }
                } else {
                    return $rootScope.Total;
                }
            } else if($scope.mailbox === 'starred'){
                if ($rootScope.messageTotals && $rootScope.messageTotals.Starred) {
                    return $rootScope.messageTotals.Starred;
                } else {
                    return $rootScope.Total;
                }
            } else {
                if ($rootScope.messageTotals) {
                    if($rootScope.messageTotals.Locations[CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox]]) {
                        return $rootScope.messageTotals.Locations[CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox]];
                    } else {
                        return 0;
                    }
                } else {
                    return $rootScope.Total;
                }
            }
        }
    };

    $scope.makeDropdownPages = function() {
        var ddp = [];
        var ddp2 = [];
        var makeRangeCounter = 0;

        for (var i = 0; i <= parseInt($scope.messageCount() - 1); i++) {
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

    $scope.getMessagesParameters = function(mailbox) {
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

    $scope.refreshMessages = function(silently, empty) {
        var mailbox = $state.current.name.replace('secured.', '');
        var params = $scope.getMessagesParameters(mailbox);

        Message.query(params).$promise.then(function(result) {
            $scope.messages = result;

            if(!!!empty) {
                $scope.emptying = false;
            }
        }, function(error) {
            notify({message: 'Error during quering messages', classes: 'notification-danger'});
            $log.error(error);
        });
    };

    $scope.refreshMessagesCache = function () {
        var deferred = $q.defer();
        var params = $scope.getMessagesParameters($scope.mailbox);

        messageCache.query(params).then(function(messages) {
            $scope.messages = messages;
            deferred.resolve();
        }, function(error) {
            error.message = 'Error during refresh messages from cache';
            deferred.reject(error);
        });

        return deferred.promise;
    };

    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    $scope.showTo = function(message) {
        return (
            $scope.senderIsMe(message) &&
            (
                !$state.is('secured.inbox') &&
                !$state.is('secured.archive')  &&
                !$state.is('secured.spam')  &&
                !$state.is('secured.trash')
            )
        ) ? true : false;
    };

    $scope.showFrom = function(message) {
        return ((
                !$state.is('secured.inbox') &&
                !$state.is('secured.drafts')  &&
                !$state.is('secured.archive') &&
                !$state.is('secured.sent') &&
                !$state.is('secured.spam') &&
                !$state.is('secured.trash')
            )
        ) ? true : false;
    };

    $scope.senderIsMe = function(message) {
        var result = false;

        for( var i = 0, len = $scope.user.Addresses.length; i < len; i++ ) {
            if( $scope.user.Addresses[i].Email === message.SenderAddress ) {
                result = true;
            }
        }

        return result;
    };

    $scope.getLabel = function(id) {
        return _.where($scope.labels, {ID: id})[0];
    };

    $scope.getColorLabel = function(id) {
        return {
            backgroundColor: $scope.getLabel(id).Color
        };
    };

    $scope.onSelectMessage = function(event, message) {
        if(!lastChecked) {
            lastChecked = message;
        } else {
            if (event.shiftKey) {
                var start = _.indexOf($scope.messages, message);
                var end = _.indexOf($scope.messages, lastChecked);

                _.each($scope.messages.slice(Math.min(start, end), Math.max(start, end) + 1), function(message) {
                    message.Selected = true;
                });
            }

            lastChecked = message;
        }

        $scope.allSelected();
    };

    $scope.onStartDragging = function(event, ui, message) {
        setTimeout( function() {
            $('#draggableMailsHelper strong b').text($scope.selectedMessages().length);
        }, 20);

        $('body').addClass('dragging');
        $('#main').append('<div id="dragOverlay"></div>');

        if(message && !!!message.Selected) {
            message.Selected = true;
            $scope.$apply();
        }
    };

    $scope.onEndDragging = function(event, ui, message) {
        $('body').removeClass('dragging');

        $('#dragOverlay').fadeOut(200, function() {
            $(this).remove();
        });
    };

    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };

    $scope.start = function() {
        return ($scope.page - 1) * $scope.messagesPerPage + 1;
    };

    $scope.end = function() {
        var end;

        end = $scope.start() + $scope.messagesPerPage - 1;

        if (end > $scope.messageCount()) {
            end = $scope.messageCount();
        }

        return end;
    };

    $scope.hasNextPage = function() {
        return $scope.messageCount() > ($scope.page * $scope.messagesPerPage);
    };

    $scope.navigateToMessage = function(event, message) {
        if (!event || !$(event.target).closest("td").hasClass("actions")) {
            if (message === 'last') {
                message = _.last(messages);
            } else if (message === 'first') {
                message = _.first(messages);
            }

            if ($state.is('secured.drafts')) {
                networkActivityTracker.track(
                    Message.get({id: message.ID}).$promise.then(
                        function(m) {
                            m.decryptBody(m.Body, m.Time).then(function(body) {
                                m.Body = body;

                                if(m.Attachments && m.Attachments.length > 0) {
                                    m.attachmentsToggle = true;
                                }

                                $rootScope.$broadcast('loadMessage', m);
                            }, function(error) {
                                notify({message: 'Error during the decryption of the message', classes: 'notification-danger'});
                                $log.error(error); // TODO send to back-end
                            });
                        }, function(error) {
                            notify({message: 'Error during the getting message', classes: 'notification-danger'});
                            $log.error(error); // TODO send to back-end
                        }
                    )
                );
            } else {
                if(message.IsRead === 0) {
                    message.IsRead = 1;
                    Message.read({IDs: [message.ID]});
                    messageCache.set([{Action: 3, ID: message.ID, Message: message}], true, {Location: CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox], Page: $scope.page - 1});
                    messageCounts.updateUnread('mark', [message], true);
                }
                $rootScope.scrollPosition = $('#content').scrollTop();
                $state.go("secured." + $scope.mailbox + ".message", {
                    id: message.ID
                });
            }
        }
    };

    $scope.toggleStar = function(message) {
        var inStarred = $state.is('secured.starred');
        var index = $scope.messages.indexOf(message);
        var ids = [];
        var promise;
        var counters = messageCounts.get();

        ids.push(message.ID);

        if(message.Starred === 1) {
            promise = Message.unstar({IDs: ids}).$promise;
            $rootScope.messageTotals.Starred--;
            message.Starred = 0;

            if (message.IsRead === 0) {
                counters.Starred--;
                messageCounts.update(counters);
            }
            if (inStarred) {
                $scope.messages.splice(index, 1);
            }
        } else {
            promise = Message.star({IDs: ids}).$promise;
            $rootScope.messageTotals.Starred++;
            message.Starred = 1;
            if (message.IsRead === 0) {
                counters.Starred++;
                messageCounts.update(counters);
            }
        }

        messageCache.set([{Action: 3, ID: message.ID, Message: message}], true);
    };

    $scope.allSelected = function() {
        var status = true;

        if ($scope.messages && $scope.messages.length > 0) {
            _.forEach($scope.messages, function(message) {
                if (!!!message.Selected) {
                    status = false;
                }
            });
        } else {
            status = false;
        }

        $scope.allSelectedCheckbox = status;

        return status;
    };

    $scope.selectAllMessages = function(val) {
        var status = !!!$scope.allSelected();

        _.forEach($scope.messages, function(message) {
            message.Selected = status;
        });
    };

    $scope.unselectAllMessages = function() {
        _.forEach($scope.messages, function(message) {
            message.Selected = false;
        });
    };

    $scope.selectedMessages = function() {
        return _.select($scope.messages, function(message) {
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

    $scope.messagesCanBeMovedTo = function(otherMailbox) {
        if (otherMailbox === "inbox") {
            return _.contains(["spam", "trash"], $scope.mailbox);
        } else if (otherMailbox === "trash") {
            return _.contains(["inbox", "drafts", "spam", "sent", "starred"], $scope.mailbox);
        } else if (otherMailbox === "spam") {
            return _.contains(["inbox", "starred", "trash"], $scope.mailbox);
        } else if (otherMailbox === "drafts") {
            return _.contains(["trash"], $scope.mailbox);
        }
    };

    $scope.setMessagesReadStatus = function(status) {
        var messages = $scope.selectedMessagesWithReadStatus(!status);
        var ids = _.map(messages, function(message) { return message.ID; });
        var promise = (status) ? Message.read({IDs: ids}).$promise : Message.unread({IDs: ids}).$promise;
        var events = [];

        _.each(messages, function(message) {
            message.IsRead = +status;
            events.push({Action: 3, ID: message.ID, Message: message});
        });

        messageCounts.updateUnread('mark', messages, status);
        messageCache.set(events, true);

        $scope.unselectAllMessages();
    };

    $scope.discardDraft = function(id) {
        var movedMessages = [];
        var message = messageCache.get(id).then(function(message) {
            Message.trash({IDs: [id]}).$promise.then(function(result) {
                movedMessages.push({
                    LabelIDs: message.LabelIDs,
                    OldLocation: message.Location,
                    IsRead: message.IsRead,
                    Location: CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                    Starred: message.Starred
                });

                messageCounts.updateUnread('move', movedMessages);
                messageCounts.updateTotals('move', movedMessages);

                $scope.messages = _.without($scope.messages, message);
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
            var m = {LabelIDs: message.LabelIDs, OldLocation: message.Location,
                IsRead: message.IsRead, Location: CONSTANTS.MAILBOX_IDENTIFIERS[mailbox],
                Starred: message.Starred};
            var index = $scope.messages.indexOf(message);

            movedMessages.push(m);
            message.Location = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
            message.Selected = false;

            if(!$state.is('secured.label') && !$state.is('secured.starred')) {
                $scope.messages.splice(index, 1);
            }

            events.push({Action: 3, ID: message.ID, Message: message});

            if(inDelete) {
                $rootScope.$broadcast('deleteMessage', message.ID);
            }
        });

        if(events.length > 0) {
            messageCache.set(events, true, {Location: CONSTANTS.MAILBOX_IDENTIFIERS[$scope.mailbox], Page: $scope.page - 1});
        }

        $scope.unselectAllMessages();

        messageCounts.updateUnread('move', movedMessages);
        messageCounts.updateTotals('move', movedMessages);

        var promiseSuccess = function(result) {
            if(events.length > 0) {
                messageCache.sync();
            }

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

        if ($scope.messages.length === 0) {
            networkActivityTracker.track(promise.then(promiseSuccess, promiseError));
        } else {
            promise.then(promiseSuccess, promiseError);
        }

        return deferred.promise;
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
                            messageCounts.empty(location);
                            $rootScope.$broadcast('updateCounters');
                            $rootScope.$broadcast('refreshMessagesCache');
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
                messageCounts.updateUnreadLabels($scope.selectedMessages(), toApply, toRemove);
                messageCounts.updateTotalLabels($scope.selectedMessages(), toApply, toRemove);

                if(alsoArchive === true) {
                    deferred.resolve($scope.moveMessagesTo('archive'));
                }

                if($state.is('secured.label') && toRemove.indexOf($stateParams.id) !== -1) {
                    $scope.messages = _.difference($scope.messages, $scope.selectedMessages());
                }

                if(alsoArchive === false) {
                    _.each($scope.selectedMessages(), function(message) {
                        message.LabelIDs = _.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove);
                    });

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
        if(angular.isUndefined(page)) {
            page = parseInt($('#page').val());
        }

        $rootScope.scrollToBottom = scrollToBottom === true;
        $scope.unselectAllMessages();
        $scope.page = page;

        if (page > 0 && $scope.messageCount() > ((page - 1) * $scope.messagesPerPage)) {
            if (page === 1) {
                page = undefined;
            }
            $state.go($state.current.name, _.extend({}, $state.params, {
                page: page
            }));
        }
    };

    $scope.hasAdjacentMessage = function(message, adjacency) {
        if (adjacency === +1) {
            if (messages.indexOf(message) === messages.length - 1) {
                return $scope.hasNextPage();
            } else {
                return true;
            }
        } else if (adjacency === -1) {
            if (messages.indexOf(message) === 0) {
                return $scope.page > 1;
            } else {
                return true;
            }
        }
    };

    $scope.goToAdjacentMessage = function(message, adjacency) {
        var idx = messages.indexOf(message);

        if (adjacency === +1 && idx === messages.length - 1) {
            $state.go("^.relative", {
                rel: 'first',
                page: $scope.page + adjacency
            });
        } else if (adjacency === -1 && messages.indexOf(message) === 0) {
            $state.go("^.relative", {
                rel: 'last',
                page: $scope.page + adjacency
            });
        } else if (Math.abs(adjacency) === 1) {
            $scope.navigateToMessage(null, messages[idx + adjacency]);
        }
    };

    $scope.initialization();
});
