angular.module("proton.cache", [])

.service("cache", function(
    $q,
    $rootScope,
    $state,
    $stateParams,
    authentication,
    CONSTANTS,
    Conversation,
    Message,
    cacheCounters,
    networkActivityTracker,
    tools
) {
    var api = {};
    var messagesCached = [];
    var conversationsCached = [];
    var timeCached = {};
    var DELETE = 0;
    var CREATE = 1;
    var UPDATE_DRAFT = 2;
    var UPDATE_FLAGS = 3;

    /**
    * Save conversations in conversationsCached and add loc in attribute
    * @param {Array} conversations
    */
    var storeConversations = function(conversations) {
        _.each(conversations, function(conversation) {
            var current = _.findWhere(conversationsCached, {ID: conversation.ID});

            if(angular.isDefined(current)) {
                var index = conversationsCached.indexOf(current);

                _.extend(conversationsCached[index], conversation);
            } else {
                insertConversation(conversation);
            }
        });
    };

    /**
     * Save messages in cache
     * @param {Array} messages
     */
    var storeMessages = function(messages) {
        _.each(messages, function(message) {
            var current = _.findWhere(messagesCached, {ID: message.ID});

            message = new Message(message);

            if(angular.isDefined(current)) {
                // Update message
                var index = messagesCached.indexOf(current);

                _.extend(messagesCached[index], message);
            } else {
                // Add message
                messagesCached.push(message);
            }
        });
    };

    /**
     * Store time for conversation per location
     * @param {String} conversationId
     * @param {String} loc
     * @param {Integer} time
     */
    var storeTime = function(conversationId, loc, time) {
        timeCached[conversationId] = timeCached[conversationId] || {};
        timeCached[conversationId][loc] = time;
    };

    /**
     * Insert conversation in conversationsCached
     * @param {Object} conversation
     */
    var insertConversation = function(conversation) {
        conversationsCached.push(conversation);
    };

    var updateConversation = function(conversation) {
        var current = _.findWhere(conversationsCached, {ID: conversation.ID});

        if(angular.isDefined(current)) {
            var index = conversationsCached.indexOf(current);

            _.extend(conversationsCached[index], conversation);
        }
    };

    /**
     * Return a list of messages reordered by Time
     * @param {Array} messages
     * @return {Array} don't miss this array is reversed
     */
    var orderMessage = function(messages) {
        if(angular.isArray(messages)) {
            return _.sortBy(messages, 'Time').reverse();
        } else {
            return [];
        }
    };

    /**
     * Return a list of conversations reordered by Time for a specific location
     * @param {Array} conversations
     * @param {String} loc
     * @return {Array} don't miss this array is reversed
     */
    var orderConversation = function(conversations, loc) {
        if(angular.isArray(conversations)) {
            return _.sortBy(conversations, function(conversation) {
                return api.getTime(conversation.ID, loc);
            }).reverse();
        } else {
            return [];
        }
    };

    /**
     * Return a vector to calculate the counters
     * @param {Object} element - element to analyse (conversation or message)
     * @param {Boolean} unread - true if unread case
     * @param {String} type = conversation or message
     * @return {Object}
     */
    var vector = function(element, unread, type) {
        var result = {};
        var condition = true;
        var locs = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

        if(unread === true) {
            if(type === 'message') {
                condition = element.IsRead === 0;
            } else if(type === 'conversation') {
                condition = element.NumUnread > 0;
            }
        }

        _.each(locs, function(loc) {
            if(angular.isDefined(element.LabelIDs) && element.LabelIDs.indexOf(loc) !== -1 && condition) {
                result[loc] = 1;
            } else {
                result[loc] = 0;
            }
        });

        return result;
    };

    /**
     * Update time for conversation
     * @param {Object} message
     */
    var manageTimes = function(message) {
        if(angular.isArray(message.LabelIDs)) {
            _.each(message.LabelIDs, function(labelID) {
                storeTime(message.ConversationID, labelID, message.Time);
            });
        }
    };

    /**
     * Manage the updating to calcultate the total number of messages and unread messages
     * @param {Object} oldElement
     * @param {Object} newElement
     * @param {String} type - 'message' or 'conversation'
     */
    var manageCounters = function(oldElement, newElement, type) {
        var oldUnreadVector = vector(oldElement, true, type);
        var newUnreadVector = vector(newElement, true, type);
        var newTotalVector = vector(newElement, false, type);
        var oldTotalVector = vector(oldElement, false, type);
        var locs = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

        _.each(locs, function(loc) {
            var deltaUnread = newUnreadVector[loc] - oldUnreadVector[loc];
            var deltaTotal = newTotalVector[loc] - oldTotalVector[loc];
            var currentUnread;
            var currentTotal;

            if(type === 'message') {
                currentUnread = cacheCounters.unreadMessage(loc);
                currentTotal = cacheCounters.totalMessage(loc);
                cacheCounters.updateMessage(loc, currentTotal + deltaTotal, currentUnread + deltaUnread);
            } else if(type === 'conversation') {
                currentUnread = cacheCounters.unreadConversation(loc);
                currentTotal = cacheCounters.totalConversation(loc);
                cacheCounters.updateConversation(loc, currentTotal + deltaTotal, currentUnread + deltaUnread);
            }
        });
    };

    /**
     * Return loc specified in the request
     * @param {Object} request
     * @return {String} loc
     */
    var getLocation = function(request) {
        return request.Label;
    };

    /**
     * Call API to get the list of conversations
     * @param {Object} request
     * @return {Promise}
     */
    var queryConversations = function(request) {
        var deferred = $q.defer();
        var loc = getLocation(request);
        var context = tools.cacheContext(request);

        Conversation.query(request).then(function(result) {
            var data = result.data;

            if(data.Code === 1000) {
                // Set total value in rootScope
                $rootScope.Total = data.Total;

                // Store time value
                _.each(data.Conversations, function(conversation) {
                    storeTime(conversation.ID, loc, conversation.Time);
                });

                // Only for cache context
                if(context === true) {
                    // Set total value in cache
                    cacheCounters.updateConversation(loc, data.Total, data.Unread);
                    // Store conversations
                    storeConversations(data.Conversations);
                    // Return conversations ordered
                    deferred.resolve(orderConversation(data.Conversations, loc));
                } else {
                    deferred.resolve(data.Conversations);
                }
            } else {
                deferred.reject();
            }
        });

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    /**
     * Query api to get messages
     * @param {Object} request
     * @return {Promise}
     */
    var queryMessages = function(request) {
        var deferred = $q.defer();
        var loc = getLocation(request);
        var context = tools.cacheContext(request);

        Message.query(request).$promise.then(function(result) {
            var messages = result.Messages;

            $rootScope.Total = result.Total;

            _.each(messages, function(message) {
                message.NumAttachments = message.HasAttachment;
                message.Senders = [message.Sender];
                message.Recipients = _.uniq([].concat(message.ToList || []).concat(message.CCList || []).concat(message.BCCList || []));
            });

            // Store messages
            storeMessages(messages);

            // Only for cache context
            if(context === true) {
                // Set total value in cache
                cacheCounters.updateMessage(loc, result.Total);
                // Return messages ordered
                deferred.resolve(orderMessage(messages));
            } else {
                deferred.resolve(messages);
            }
        });

        return deferred.promise;
    };

    /**
     * Get conversation from API and store it in the cache
     * @param {String} id
     * @return {Promise}
     */
    var queryConversationMessages = function(id) {
        var deferred = $q.defer();
        var mailbox = tools.currentMailbox();

        Conversation.get(id).then(function(result) {
            var data = result.data;

            if(data.Code === 1000) {
                var messages = [];

                _.each(data.Messages, function(message) {
                    messages.push(new Message(message));
                });

                storeConversations([data.Conversation]);
                storeMessages(messages);

                deferred.resolve(orderMessage(messages));
            } else {
                deferred.reject();
            }
        });

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    /**
     * Get conversation from back-end and store it in the cache
     * @param {String} id
     * @return {Promise}
     */
    var getConversation = function(id) {
        var deferred = $q.defer();

        Conversation.get(id).then(function(result) {
            var data = result.data;

            if(data.Code === 1000) {
                var conversation = data.Conversation;
                var messages = data.Messages;
                var message = _.max(messages, function(message){ return message.Time; });

                conversation.preloaded = true;
                conversation.Time = message.Time;
                storeConversations([conversation]);
                storeMessages(messages);
                deferred.resolve(conversation);
            } else {
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    /**
    * Call the API to get message
    * @param {String} id
    * @return {Promise}
    */
    var getMessage = function(id) {
        var deferred = $q.defer();

        Message.get({ id: id }).$promise.then(function(message) {
            message = new Message(message);
            message.preloaded = true;
            storeMessages([message]);
            deferred.resolve(message);
        });

        return deferred.promise;
    };

    /**
     * Return time for a specific conversation and location
     */
    api.getTime = function(conversationId, loc) {
        if(angular.isDefined(timeCached[conversationId]) && angular.isNumber(timeCached[conversationId][loc])) {
            return timeCached[conversationId][loc];
        } else {
            var conversation = api.getConversationCached(conversationId);

            return conversation.Time;
        }
    };

    /**
     * Return message list
     * @param {Object} request
     * @return {Promise}
     */
    api.queryMessages = function(request) {
        var deferred = $q.defer();
        var loc = getLocation(request);
        var context = tools.cacheContext(request);
        var callApi = function() {
            deferred.resolve(queryMessages(request));
        };

        if(context) {
            var page = request.Page || 0;
            var start = page * CONSTANTS.MESSAGES_PER_PAGE;
            var end = start + CONSTANTS.MESSAGES_PER_PAGE;
            var total;
            var number;
            var mailbox = tools.currentMailbox();
            var messages = _.filter(messagesCached, function(message) {
                return angular.isDefined(message.LabelIDs) && message.LabelIDs.indexOf(loc.toString()) !== -1;
            });

            messages = orderMessage(messages);

            switch(mailbox) {
                case 'label':
                    total = cacheCounters.totalMessage($stateParams.label);
                    break;
                default:
                    total = cacheCounters.totalMessage(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            if(angular.isDefined(total)) {
                if((total % CONSTANTS.MESSAGES_PER_PAGE) === 0) {
                    number = CONSTANTS.MESSAGES_PER_PAGE;
                } else {
                    if((Math.ceil(total / CONSTANTS.MESSAGES_PER_PAGE) - 1) === page) {
                        number = total % CONSTANTS.MESSAGES_PER_PAGE;
                    } else {
                        number = CONSTANTS.MESSAGES_PER_PAGE;
                    }
                }

                messages = messages.slice(start, end);

                // Supposed total equal to the total cache?
                if(messages.length === number) {
                    deferred.resolve(messages);
                } else {
                    callApi();
                }
            } else {
                callApi();
            }
        } else {
            callApi();
        }

        return deferred.promise;
    };

    /**
     * Return conversation list with request specified in cache or call api
     * @param {Object} request
     * @return {Promise}
     */
    api.queryConversations = function(request) {
        var deferred = $q.defer();
        var loc = getLocation(request);
        var context = tools.cacheContext(request);
        var callApi = function() {
            // Need data from the server
            deferred.resolve(queryConversations(request));
        };

        // In cache context?
        if(context) {
            var page = request.Page || 0;
            var start = page * CONSTANTS.MESSAGES_PER_PAGE;
            var end = start + CONSTANTS.MESSAGES_PER_PAGE;
            var total;
            var number;
            var mailbox = tools.currentMailbox();
            var conversations = _.filter(conversationsCached, function(conversation) {
                return angular.isDefined(conversation.LabelIDs) && conversation.LabelIDs.indexOf(loc.toString()) !== -1;
            });

            conversations = orderConversation(conversations, loc);

            switch(mailbox) {
                case 'label':
                    total = cacheCounters.totalConversation($stateParams.label);
                    break;
                default:
                    total = cacheCounters.totalConversation(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            if(angular.isDefined(total)) {
                if(total === 0) {
                    number = 0;
                } else {
                    if((total % CONSTANTS.MESSAGES_PER_PAGE) === 0) {
                        number = CONSTANTS.MESSAGES_PER_PAGE;
                    } else {
                        if((Math.ceil(total / CONSTANTS.MESSAGES_PER_PAGE) - 1) === page) {
                            number = total % CONSTANTS.MESSAGES_PER_PAGE;
                        } else {
                            number = CONSTANTS.MESSAGES_PER_PAGE;
                        }
                    }
                }

                conversations = conversations.slice(start, end);

                // Supposed total equal to the total cache?
                if(conversations.length === number) {
                    deferred.resolve(conversations);
                } else {
                    callApi();
                }
            } else {
                callApi();
            }
        } else {
            callApi();
        }

        return deferred.promise;
    };

    /**
     * Try to find the result in the cache
     * @param {String} conversationId
     */
    api.queryConversationMessages = function(conversationId) {
        var deferred = $q.defer();
        var mailbox = tools.currentMailbox();
        var conversation = _.findWhere(conversationsCached, {ID: conversationId});
        var callApi = function() {
            deferred.resolve(queryConversationMessages(conversationId));
        };

        if(angular.isDefined(conversation)) {
            var messages = _.where(messagesCached, {ConversationID: conversationId});

            if(conversation.NumMessages === messages.length) {
                deferred.resolve(orderMessage(messages));
            } else {
                callApi();
            }
        } else {
            callApi();
        }

        return deferred.promise;
    };

    /**
     * Return a copy of messages cached for a specific ConversationID
     * @param {String} conversationId
     */
    api.queryMessagesCached = function(conversationId) {
        var mailbox = tools.currentMailbox();
        var messages = _.where(messagesCached, {ConversationID: conversationId});

        messages = orderMessage(messages);

        return angular.copy(messages);
    };

    /**
     * Return conversation cached
     * @param {String} conversationId
     * @return {Object}
     */
    api.getConversationCached = function(conversationId) {
        var result = _.findWhere(conversationsCached, {ID: conversationId});

        return angular.copy(result);
    };

    /**
     * Return message cached
     * @param {String} messageId
     * @return {Object}
     */
    api.getMessageCached = function(messageId) {
        return angular.copy(_.findWhere(messagesCached, {ID: messageId}));
    };

    /**
     * @param {String} conversationId
     * @return {Promise}
     */
    api.getConversation = function(conversationId) {
        var deferred = $q.defer();
        var conversation = _.findWhere(conversationsCached, {ID: conversationId});

        if(angular.isDefined(conversation)) {
            deferred.resolve(conversation);
        } else {
            deferred.resolve(getConversation(conversationId));
        }

        return deferred.promise;
    };

    /**
     * Accessible method to preload a specific conversation
     */
    api.preloadConversation = function(id) {
        return getConversation(id);
    };

    /**
     * Preload message and store it
     */
    api.preloadMessage = function(id) {
        return getMessage(id);
    };

    /**
    * Return the message specified by the id from the cache or the back-end
    * @param {String} ID - Message ID
    * @return {Promise}
    */
    api.getMessage = function(ID) {
        var deferred = $q.defer();
        var message = _.findWhere(messagesCached, {ID: ID});

        if(angular.isDefined(message) && angular.isDefined(message.Body)) {
            deferred.resolve(message);
        } else {
            deferred.resolve(getMessage(ID));
        }

        return deferred.promise;
    };

    /**
    * Delete message or conversation in the cache if the element is present
    * @param {Object} event
    * @return {Promise}
    */
    api.delete = function(event) {
        var deferred = $q.defer();

        // Delete message
        messagesCached = _.reject(messagesCached, function(message) {
            return message.ID === event.ID;
        });

        // Delete conversation
        conversationsCached = _.reject(conversationsCached, function(conversation) {
            if(conversation.ID === event.ID && conversation.NumUnread > 0) {
                _.each(conversation.LabelIDs, function(labelID) {
                    var unread = cacheCounters.unreadConversation(labelID);
                    var total = cacheCounters.totalConversation(labelID);

                    cacheCounters.updateConversation(labelID, total - 1, unread - 1);
                });
            }

            return conversation.ID === event.ID;
        });

        deferred.resolve();

        return deferred.promise;
    };

    /**
    * Remove conversations from cache loc
    * @param {String} loc
    */
    api.empty = function(loc) {
        var toRemove = [];

        _.each(conversationsCached, function(conversation) {
            if(angular.isArray(conversation.LabelIDs) && conversation.LabelIDs.indexOf(loc) !== -1) {
                messagesCached = _.reject(messagesCached, function(message) {
                    return message.ConversationID === conversation.ID;
                });

                toRemove.push(conversation);
            }
        });

        _.each(toRemove, function(conversation) {
            var index = conversationsCached.indexOf(conversation);

            if(angular.isArray(conversation.LabelIDs)) {
                if(conversation.LabelIDs.length === 1) {
                    conversationsCached.splice(index, 1);
                } else if(conversation.LabelIDs.length > 1) {
                    conversationsCached[index].LabelIDs = _.without(conversation.LabelIDs, loc);
                }
            }
        });

        cacheCounters.updateConversation(loc, 0, 0);

        api.callRefresh();
    };

    /**
    * Preload conversations for inbox (first 2 pages) and sent (first page)
    * @return {Promise}
    */
    api.preloadInboxAndSent = function() {
        var mailbox = tools.currentMailbox();
        var deferred = $q.defer();
        var requestInbox;
        var requestSent;

        if(mailbox === 'inbox' && angular.isUndefined($stateParams.id)) {
            requestInbox = {Label: CONSTANTS.MAILBOX_IDENTIFIERS.inbox, Page: 1};
            requestSent = {Label: CONSTANTS.MAILBOX_IDENTIFIERS.sent, Page: 0};
        } else if(mailbox === 'sent' && angular.isUndefined($stateParams.id)) {
            requestInbox = {Label: CONSTANTS.MAILBOX_IDENTIFIERS.inbox, Page: 0, PageSize: 100};
            requestSent = {};
        } else {
            requestInbox = {Label: CONSTANTS.MAILBOX_IDENTIFIERS.inbox, Page: 0, PageSize: 100};
            requestSent = {Label: CONSTANTS.MAILBOX_IDENTIFIERS.sent, Page: 0};
        }

        $q.all({
            inbox: queryConversations(requestInbox),
            sent: queryConversations(requestSent)
        }).then(function() {
            deferred.resolve();
        });

        return deferred.promise;
    };

    /**
    * Add a new message in the cache
    * @param {Object} event
    * @return {Promise}
    */
    api.createMessage = function(event) {
        var deferred = $q.defer();
        var messages = [event.Message];

        manageTimes(event.Message);

        // Save new messages
        storeMessages(messages);

        deferred.resolve();

        return deferred.promise;
    };

    /**
     * Add a new conversation in the cache
     * @param {Object} event
     * @return {Promise}
     */
    api.createConversation = function(event) {
        var deferred = $q.defer();
        var current = _.findWhere(conversationsCached, {ID: event.ID});

        if(angular.isDefined(current)) {
            updateConversation(event.Conversation);
            deferred.resolve();
        } else {
            // NOTE When we send a message to yourself, the LabelIDs parameter is undefined
            // Probably a back-end bug
            if(angular.isUndefined(event.Conversation.LabelIDs)) {
                var messages = api.queryMessagesCached(event.Conversation.ID);
                var labelIDs = [];

                _.each(messages, function(message) {
                    labelIDs = labelIDs.concat(message.LabelIDs);
                });

                event.Conversation.LabelIDs = _.uniq(labelIDs);
            }

            insertConversation(event.Conversation);
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
    * Update message attached to the id specified
    * @param {Object} event
    * @return {Promise}
    */
    api.updateFlagMessage = function(event) {
        var deferred = $q.defer();
        var current = _.findWhere(messagesCached, {ID: event.ID});

        // Present in the current cache?
        if(angular.isDefined(current)) {
            var index = messagesCached.indexOf(current);
            var message = new Message();

            _.extend(message, current);
            _.extend(message, event.Message);

            if(JSON.stringify(message) === JSON.stringify(current)) {
                deferred.resolve();
            } else {
                // Manage labels
                if(angular.isDefined(event.Message.LabelIDsRemoved)) {
                    message.LabelIDs = _.difference(message.LabelIDs, event.Message.LabelIDsRemoved);
                    delete message.LabelIDsRemoved;
                }

                if(angular.isDefined(event.Message.LabelIDsAdded)) {
                    message.LabelIDs = _.uniq(message.LabelIDs.concat(event.Message.LabelIDsAdded));
                    delete message.LabelIDsAdded;
                }

                messagesCached[index] = message;
                manageCounters(current, messagesCached[index], 'message');
                manageTimes(message);
                deferred.resolve();
           }
        } else {
            // Do nothing
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     * Update conversation cached
     * @param {Object} event
     * @return {Promise}
     */
     api.updateFlagConversation = function(event) {
         var deferred = $q.defer();
         var current = _.findWhere(conversationsCached, {ID: event.ID});

         if(angular.isDefined(current)) {
             var conversation = {};
             var index = conversationsCached.indexOf(current);

             _.extend(conversation, current);
             _.extend(conversation, event.Conversation);

             // Manage labels
             if(angular.isDefined(event.Conversation.LabelIDsRemoved)) {
                 conversation.LabelIDs = _.difference(conversation.LabelIDs, event.Conversation.LabelIDsRemoved);
                 delete conversation.LabelIDsRemoved;
             }

             if(angular.isDefined(event.Conversation.LabelIDsAdded)) {
                 conversation.LabelIDs = _.uniq(conversation.LabelIDs.concat(event.Conversation.LabelIDsAdded));
                 delete conversation.LabelIDsAdded;
             }

             // Update conversation cached
             conversationsCached[index] = conversation;
             manageCounters(current, conversation, 'conversation');
             deferred.resolve();
         } else {
            // Get conversation from API to get all informations
            getConversation(event.ID).then(function() {
                deferred.resolve();
            });
         }

         return deferred.promise;
     };

    /**
    * Manage the cache when a new event comes
    * @param {Array} events
    * @return {Promise}
    */
    api.events = function(events) {
        var deferred = $q.defer();
        var promises = [];

        console.log(events);

        _.each(events, function(event) {
            var type;

            if(event.Action === DELETE) {
                promises.push(api.delete(event));
            } else if(angular.isDefined(event.Message)) {
                switch (event.Action) {
                    case CREATE:
                        promises.push(api.createMessage(event));
                        break;
                    case UPDATE_DRAFT:
                        promises.push(api.updateFlagMessage(event));
                        break;
                    case UPDATE_FLAGS:
                        promises.push(api.updateFlagMessage(event));
                        break;
                    default:
                        break;
                }
            } else if(angular.isDefined(event.Conversation)) {
                switch (event.Action) {
                    case CREATE:
                        promises.push(api.createConversation(event));
                        break;
                    case UPDATE_DRAFT:
                        promises.push(api.updateFlagConversation(event));
                        break;
                    case UPDATE_FLAGS:
                        promises.push(api.updateFlagConversation(event));
                        break;
                    default:
                        break;
                }
            }
        });

        $q.all(promises).then(function() {
            api.callRefresh();
            deferred.resolve();
        }, function() {
            deferred.reject();
        });

        return deferred.promise;
    };

    /**
     * Ask to the message list controller to refresh the messages
     * First with the cache
     * Second with the query call
     */
    api.callRefresh = function() {
        $rootScope.$broadcast('refreshConversations');
        $rootScope.$broadcast('refreshCounters');
        $rootScope.$broadcast('updatePageName');
        $rootScope.$broadcast('refreshConversation');
        $rootScope.$broadcast('refreshMessage');
    };

    /**
     * Clear cache and hash
     */
    api.clear = function() {
        conversationsCached = [];
        messagesCached = [];
    };

    /**
     * Reset cache and hash then preload inbox and sent
     */
    api.reset = function() {
        api.clear();
        api.preloadInboxAndSent();
    };

    /**
     * Manage expiration time for messages in the cache
     */
    api.expiration = function() {
        var now = Date.now() / 1000;
        var removed = 0;

        messagesCached = _.filter(messagesCached, function(message) {
            var expTime = message.ExpirationTime;
            var response = (expTime !== 0 && expTime < now) ? false : true;

            if (!response) {
                removed++;
            }

            return response;
        });

        if (removed > 0) {
            api.callRefresh();
        }
    };

    /**
     * Return previous ID of message specified
     * @param {Object} conversation
     * @param {String} type - 'next' or 'previous'
     * @return {Promise}
     */
    api.more = function(conversation, type) {
        var deferred = $q.defer();
        var loc = tools.currentLocation();
        var request = {PageSize: 1, Label: loc};

        if(type === 'previous') {
            request.End = conversation.Time;
        } else {
            request.Begin = conversation.Time;
        }

        queryConversations(request).then(function(conversation) {
            deferred.resolve();
            // if(angular.isArray(conversation) && conversation.length > 0) {
            //     if(type === 'next') {
            //         var first = _.first(conversation);
            //
            //         deferred.resolve(first.ID);
            //     } else if(type === 'previous') {
            //         var last = _.last(conversation);
            //
            //         deferred.resolve(last.ID);
            //     }
            // } else {
            //     deferred.reject();
            // }
        });

        return deferred.promise;
    };

    return api;
})

.service('cacheCounters', function(Message, CONSTANTS, Conversation, $q, $rootScope, authentication) {
    var api = {};
    var counters = {};
    // {
    //     loc: {
    //         message: {
    //             total: value,
    //             unread: value
    //         },
    //         conversation: {
    //             total: value,
    //             unread: value
    //         }
    //     }
    // }
    var exist = function(loc) {
        if(angular.isUndefined(counters[loc])) {
            counters[loc] = {
                message: {
                    total: 0,
                    unread: 0
                },
                conversation: {
                    total: 0,
                    unread: 0
                }
            };
        }
    };

    /**
    * Query unread and total
    * @return {Promise}
    */
    api.query = function() {
        var deferred = $q.defer();

        $q.all({
            message: Message.count().$promise,
            conversation: Conversation.count()
        }).then(function(result) {
            var locs = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

            // Initialize locations
            _.each(locs, function(loc) {
                exist(loc);
            });

            _.each(result.message.Counts, function(counter) {
                counters[counter.LabelID].message.total = counter.Total || 0;
                counters[counter.LabelID].message.unread = counter.Unread || 0;
            });

            _.each(result.conversation.data.Counts, function(counter) {
                counters[counter.LabelID].conversation.total = counter.Total || 0;
                counters[counter.LabelID].conversation.unread = counter.Unread || 0;
            });

            deferred.resolve();
        },function(error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * Add a new location
     * @param {String} loc
     */
    api.add = function(loc) {
        exist(loc);
    };

    /**
    * Update the total / unread for a specific loc
    * @param {String} loc
    * @param {Integer} total
    * @param {Integer} unread
    */
    api.updateMessage = function(loc, total, unread) {
        exist(loc);

        if(angular.isDefined(total)) {
            counters[loc].message.total = total;
        }

        if(angular.isDefined(unread)) {
            counters[loc].message.unread = unread;
        }

        $rootScope.$broadcast('updatePageName');
    };

    /**
     * Update the total / unread for a specific loc
     * @param {String} loc
     * @param {Integer} total
     * @param {Integer} unread
     */
    api.updateConversation = function(loc, total, unread) {
        exist(loc);

        if(angular.isDefined(total)) {
            counters[loc].conversation.total = total;
        }

        if(angular.isDefined(unread)) {
            counters[loc].conversation.unread = unread;
        }

        $rootScope.$broadcast('updatePageName');
    };

    /**
    * Get the total of messages for a specific loc
    * @param {String} loc
    */
    api.totalMessage = function(loc) {
        return counters[loc] && counters[loc].message && counters[loc].message.total;
    };

    /**
    * Get the total of conversation for a specific loc
    * @param {String} loc
    */
    api.totalConversation = function(loc) {
        return counters[loc] && counters[loc].conversation && counters[loc].conversation.total;
    };

    /**
    * Get the number of unread messages for the specific loc
    * @param {String} loc
    */
    api.unreadMessage = function(loc) {
        return counters[loc] && counters[loc].message && counters[loc].message.unread;
    };

    /**
    * Get the number of unread conversation for the specific loc
    * @param {String} loc
    */
    api.unreadConversation = function(loc) {
        return counters[loc] && counters[loc].conversation && counters[loc].conversation.unread;
    };

    /**
    * Clear loc counters
    * @param {String} loc
    */
    api.empty = function(loc) {
        if(angular.isDefined(counters[loc])) {
            counters[loc] = {
                message: {
                    total: 0,
                    unread: 0
                },
                conversation: {
                    total: 0,
                    unread: 0
                }
            };
        }
    };

    return api;
})

.factory('preloadConversation', function(
    $interval,
    cache
) {
    var api = {};
    var queue = [];
    var interval = 5000; // 15 seconds // TODO set 15 seconds for the release

    /**
    * Set current conversations viewed
    * @param {Array} conversations
    */
    api.set = function(conversations) {
        api.reset();
        api.add(conversations); // Add unread conversations to the queue
    };

    /**
    * Reset current queue
    */
    api.reset = function() {
        queue = [];
    };

    /**
    * Add unread conversations to the queue
    * @param {Array} conversations
    */
    api.add = function(conversations) {
        // Add only unread conversations to the queue
        // Filter by conversation where the Body is undefined
        queue = _.union(queue, _.where(conversations, { preloaded: undefined }));
    };

    /**
    * Preload conversations present in the queue
    */
    api.preload = function() {
        // Get the first conversation in the queue
        var element  = _.first(queue);

        if(angular.isDefined(element)) {
            var promise;

            if(angular.isDefined(element.ConversationID)) {
                promise = cache.preloadMessage(element.ID);
            } else {
                // Preload the first conversation
                promise = cache.preloadConversation(element.ID);
            }

            promise.then(function() {
                // Remove the first element in the queue
                queue = _.without(queue, element);
            });
        }
    };

    /**
    * Loop around conversations present in the queue to preload the Body
    */
    api.loop = function() {
        var looping = $interval(function() {
            api.preload();
        }, interval);
    };

    // NOTE Andy said: "We preload nothing, that's too expensive for the back-end"
    // api.loop(); // Start looping

    return api;
})

.factory('expiration', function($interval, cache) {
    var api = {};
    var interval = 5000;
    var need = false;
    var elements = [];

    /**
     * Delete message if expired
     */
    var process = function() {
        if(need === true) {
            if(elements.length > 0) {
                var messages = [];
                var type = (angular.isDefined(_.first(elements).ConversationID))?'message':'conversation';

                // Set messages
                if(type === 'message') {
                    messages = elements;
                } else if(type === 'conversation') {
                    messages = cache.queryConversationMessages(_.first(elements).ConversationID);
                }

                // Get elements expired
                var elementsExpired = _.filter(messages, function(element) {
                    return element.ExpirationTime < moment().unix();
                });

                if(elementsExpired.length > 0) {
                    // Generate an event to delete message expired in the cache
                    var events = [];

                    _.each(elementsExpired, function(message) {
                        events.push({Action: 0, ID: message.ID});
                    });

                    cache.events(events);
                }
            }

            need = false;
        }
    };

    /**
     * Start to loop
     */
    var start = function() {
        $interval(function() {
            process();
        }, interval);
    };

    /**
     * Assign new elements
     */
    api.check = function(elements) {
        elements = elements;
        need = true;
    };

    // Start looping around conversations / messages
    start();

    return api;
});
