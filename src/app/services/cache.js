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
    var dispatcher = [];
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
            updateConversation(conversation);
        });
    };

    /**
     * Save messages in cache
     * @param {Array} messages
     */
    var storeMessages = function(messages) {
        _.each(messages, function(message) {
            message = new Message(message);
            updateMessage(message);
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
     * Update message cached
     * @param {Object} message
     */
    var updateMessage = function(message) {
        var current = _.findWhere(messagesCached, {ID: message.ID});

        message = new Message(message);

        if(angular.isDefined(current)) {
            manageCounters(current, message, 'message');

            var index = messagesCached.indexOf(current);

            _.extend(messagesCached[index], message);
        } else {
            messagesCached.push(message);
        }

        manageTimes(message.ConversationID);
    };

    /**
     * Update conversation cached
     * @param {Object} conversation
     */
    var updateConversation = function(conversation) {
        var current = _.findWhere(conversationsCached, {ID: conversation.ID});

        if(angular.isDefined(current)) {
            var index = conversationsCached.indexOf(current);
            var labelIDs = conversation.LabelIDs || current.LabelIDs || [];

            if(angular.isArray(conversation.LabelIDsRemoved)) {
                labelIDs = _.difference(labelIDs, conversation.LabelIDsRemoved);
                delete conversation.LabelIDsRemoved;
            }

            if(angular.isArray(conversation.LabelIDsAdded)) {
                labelIDs = _.uniq(labelIDs.concat(conversation.LabelIDsAdded));
                delete conversation.LabelIDsAdded;
            }

            conversation.LabelIDs = labelIDs;

            manageCounters(current, conversation, 'conversation');

            _.extend(conversationsCached[index], conversation);
        } else {
            conversationsCached.push(conversation);
        }

        manageTimes(conversation.ID);
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
     * @param {String} conversationID
     */
    var manageTimes = function(conversationID) {
        if (angular.isDefined(conversationID)) {
            var conversation = api.getConversationCached(conversationID);
            var messages = api.queryMessagesCached(conversationID); // messages are ordered by -Time

            if (angular.isDefined(conversation) && messages.length > 0) {
                _.each(conversation.LabelIDs, function(labelID) {
                    // Get the most recent message for a specific label
                    var message = _.chain(messages)
                        .filter(function(message) { return message.LabelIDs.indexOf(labelID) !== -1; })
                        .first()
                        .value();

                    if (angular.isDefined(message) && angular.isDefined(message.Time)) {
                        storeTime(conversationID, labelID, message.Time);
                    }
                });
            }
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
        var context = tools.cacheContext();

        request.Limit = request.Limit || 100; // We don't call 50 conversations but 100 to improve user experience when he delete message and display quickly the next conversations

        api.getDispatcher().then(function() {
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
                        var unread = (data.Total === 0) ? 0 : data.Unread;
                        // Set total value in cache
                        cacheCounters.updateConversation(loc, data.Total, unread);
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

                api.clearDispatcher();
            });
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
        var context = tools.cacheContext();

        request.Limit = request.Limit || 100; // We don't call 50 messages but 100 to improve user experience when he delete message and display quickly the next messages

        api.getDispatcher().then(function() {
            Message.query(request).$promise.then(function(result) {
                var messages = result.Messages;

                $rootScope.Total = result.Total;

                _.each(messages, function(message) {
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

                api.clearDispatcher();
            });
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
     * Add action promise to the dispatcher
     * @param {Promise} action
     */
    api.addToDispatcher= function(action) {
        dispatcher.push(action);
    };

    /**
     * Clear the dispatcher
     */
    api.clearDispatcher = function() {
        dispatcher = [];
    };

    /**
     * Return the promises state of the dispatcher
     * @return {Promise}
     */
    api.getDispatcher = function() {
        return $q.all(dispatcher);
    };

    api.empty = function(mailbox) {
        var loc = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        var needToBeRemoved = [];
        var i = 0;

        for (i = 0; i < conversationsCached.length; i++) {
            var conversation = conversationsCached[i];

            if (angular.isDefined(conversation) && angular.isArray(conversation.LabelIDs) && conversation.LabelIDs.indexOf(loc)) {
                needToBeRemoved.push(i);
            }
        }

        for (i = 0; i < needToBeRemoved.length; i++) {
            var index = needToBeRemoved[i];

            conversationsCached.splice(index, 1);
        }

        api.callRefresh();
    };

    /**
     * Return time for a specific conversation and location
     * @return {Integer}
     */
    api.getTime = function(conversationId, loc) {
        if(angular.isDefined(timeCached[conversationId]) && angular.isNumber(timeCached[conversationId][loc])) {
            return timeCached[conversationId][loc];
        } else {
            var conversation = api.getConversationCached(conversationId);

            if(angular.isDefined(conversation)) {
                return conversation.Time;
            } else {
                return '';
            }
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
        var context = tools.cacheContext();
        var callApi = function() {
            deferred.resolve(queryMessages(request));
        };

        if(context) {
            var page = request.Page || 0;
            var start = page * CONSTANTS.ELEMENTS_PER_PAGE;
            var end = start + CONSTANTS.ELEMENTS_PER_PAGE;
            var total;
            var number;
            var mailbox = tools.currentMailbox();
            var messages = _.filter(messagesCached, function(message) {
                return angular.isDefined(message.LabelIDs) && message.LabelIDs.indexOf(loc) !== -1;
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
                if(total === 0) {
                    number = 0;
                } else {
                    if((total % CONSTANTS.ELEMENTS_PER_PAGE) === 0) {
                        number = CONSTANTS.ELEMENTS_PER_PAGE;
                    } else {
                        if((Math.ceil(total / CONSTANTS.ELEMENTS_PER_PAGE) - 1) === page) {
                            number = total % CONSTANTS.ELEMENTS_PER_PAGE;
                        } else {
                            number = CONSTANTS.ELEMENTS_PER_PAGE;
                        }
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
        var context = tools.cacheContext();
        var callApi = function() {
            // Need data from the server
            deferred.resolve(queryConversations(request));
        };

        // In cache context?
        if(context === true) {
            var page = request.Page || 0;
            var start = page * CONSTANTS.ELEMENTS_PER_PAGE;
            var end = start + CONSTANTS.ELEMENTS_PER_PAGE;
            var total;
            var number;
            var mailbox = tools.currentMailbox();
            var conversations = _.filter(conversationsCached, function(conversation) {
                return angular.isDefined(conversation.LabelIDs) && conversation.LabelIDs.indexOf(loc) !== -1 && angular.isDefined(api.getTime(conversation.ID, loc));
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
                    if((total % CONSTANTS.ELEMENTS_PER_PAGE) === 0) {
                        number = CONSTANTS.ELEMENTS_PER_PAGE;
                    } else {
                        if((Math.ceil(total / CONSTANTS.ELEMENTS_PER_PAGE) - 1) === page) {
                            number = total % CONSTANTS.ELEMENTS_PER_PAGE;
                        } else {
                            number = CONSTANTS.ELEMENTS_PER_PAGE;
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

        if(angular.isDefined(conversation) && conversation.preloaded === true) {
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
        messagesCached.splice(_.findIndex(messagesCached, function(message) {
            return message.ID === event.ID;
        }), 1);

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
    * Add a new message in the cache
    * @param {Object} event
    * @return {Promise}
    */
    api.createMessage = function(event) {
        var deferred = $q.defer();
        var messages = [event.Message];

        // Insert new message in the cache
        updateMessage(event.Message);

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

        updateConversation(event.Conversation);

        deferred.resolve();

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

                updateMessage(message);
                deferred.resolve();
           }
        } else {
            // Do nothing
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     * Update flag conversation cached
     * @param {Object} event
     * @return {Promise}
     */
    api.flagConversation = function(event) {
        var deferred = $q.defer();

        // Update conversation cached
        updateConversation(event.Conversation);

        deferred.resolve();

        return deferred.promise;
    };

    /**
     * Update a conversation
     */
    api.updateConversation = function(event) {
        var deferred = $q.defer();

        updateConversation(event.Conversation);

        deferred.resolve();

        return deferred.promise;
    };

    /**
    * Manage the cache when a new event comes
    * @param {Array} events - Object managing interaction with messages and conversations stored
    * @param {Boolean} fromBackend - indicate if the events come from the back-end
    * @return {Promise}
    */
    api.events = function(events, fromBackend) {
        var deferred = $q.defer();
        var promises = [];
        var dirty;

        if(fromBackend === true) {
            console.log('events from the back-end', events);
            dirty = false;
        } else {
            console.log('events from the front-end', events);
            dirty = true;
        }

        _.each(events, function(event) {
            if(event.Action === DELETE) { // Can be for message or conversation
                promises.push(api.delete(event));
            } else if(angular.isDefined(event.Message)) { // Manage message action
                // event.Message.dirty = dirty;
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
            } else if(angular.isDefined(event.Conversation)) { // Manage conversation action
                // event.Conversation.dirty = dirty;
                switch (event.Action) {
                    case CREATE:
                        promises.push(api.createConversation(event));
                        break;
                    case UPDATE_DRAFT:
                        promises.push(api.updateConversation(event));
                        break;
                    case UPDATE_FLAGS:
                        promises.push(api.flagConversation(event));
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
        timeCached = {};
        conversationsCached = [];
        messagesCached = [];
    };

    /**
     * Reset cache and hash then preload inbox and sent
     */
    api.reset = function() {
        api.clear();
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
     * @param {String} conversationID
     * @param {String} type - 'next' or 'previous'
     * @return {Promise}
     */
    api.more = function(conversationID, type) {
        var deferred = $q.defer();
        var loc = tools.currentLocation();
        var request = {Label: loc};
        var context = tools.cacheContext();
        var callApi = function() {
            queryConversations(request).then(function(conversations) {
                if(angular.isArray(conversations) && conversations.length > 0) {
                    var first = _.first(conversations);

                    deferred.resolve(first.ID);
                } else {
                    deferred.reject();
                }
            });
        };

        if (context === true) {
            var conversations = _.filter(conversationsCached, function(conversation) {
                return angular.isDefined(conversation.LabelIDs) && conversation.LabelIDs.indexOf(loc) !== -1 && angular.isDefined(api.getTime(conversation.ID, loc));
            });

            conversations = orderConversation(conversations, loc);

            var index = _.findIndex(conversations, {ID: conversationID});

            if (index !== -1) {
                if (type === 'previous' && angular.isDefined(conversations[index + 1])) {
                    deferred.resolve(conversations[index + 1].ID);
                } else if (type === 'next' && angular.isDefined(conversations[index - 1])) {
                    deferred.resolve(conversations[index - 1].ID);
                } else {
                    callApi();
                }
            } else {
                callApi();
            }
        } else {
            var conversation = api.getConversationCached(conversationID);

            if (type === 'previous') {
                request.End = conversation.Time;
                request.EndID = conversation.ID;
                request.Desc = 1;
            } else if (type === 'next') {
                request.Begin = conversation.Time;
                request.BeginID = conversation.ID;
                request.Desc = 0;
            }
        }

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
                    messages = cache.queryMessagesCached(_.first(elements).ConversationID);
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
