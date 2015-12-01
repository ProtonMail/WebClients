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
    var DELETE = 0;
    var CREATE = 1;
    var UPDATE = 2;
    var UPDATE_DRAFT = 2;
    var UPDATE_FLAGS = 3;

    /**
    * Save conversations in conversationsCached and add location in attribute
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
     * Reorder cache location by reverse time
     * @param {Array} elements - conversation or message
     * @param {String} parameter - ordered with this parameter
     */
    var order = function(elements, parameter) {
        if(angular.isArray(elements)) {
            return _.sortBy(elements, parameter).reverse();
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
        var locations = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

        if(unread === true) {
            if(type === 'message') {
                condition = element.IsRead === 0;
            } else if(type === 'conversation') {
                condition = element.NumUnread > 0;
            }
        }

        _.each(locations, function(location) {
            if(angular.isDefined(element.LabelIDs) && element.LabelIDs.indexOf(location) !== -1 && condition) {
                result[location] = 1;
            } else {
                result[location] = 0;
            }
        });

        return result;
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
        var locations = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

        _.each(locations, function(location) {
            var deltaUnread = newUnreadVector[location] - oldUnreadVector[location];
            var deltaTotal = newTotalVector[location] - oldTotalVector[location];
            var currentUnread;
            var currentTotal;

            if(type === 'message') {
                currentUnread = cacheCounters.unreadMessage(location);
                currentTotal = cacheCounters.totalMessage(location);
                cacheCounters.updateMessage(location, currentTotal + deltaTotal, currentUnread + deltaUnread);
            } else if(type === 'conversation') {
                currentUnread = cacheCounters.unreadConversation(location);
                currentTotal = cacheCounters.totalConversation(location);
                cacheCounters.updateConversation(location, currentTotal + deltaTotal, currentUnread + deltaUnread);
            }
        });
    };

    /**
     * Return location specified in the request
     * @param {Object} request
     * @return {String} location
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
        var location = getLocation(request);
        var context = tools.cacheContext(request);

        Conversation.query(request).then(function(result) {
            var data = result.data;

            if(data.Code === 1000) {
                // Set total value in rootScope
                $rootScope.Total = data.Total;

                // Only for cache context
                if(context === true) {
                    // Set total value in cache
                    cacheCounters.updateConversation(location, data.Total, data.Unread);
                    // Store conversations
                    storeConversations(data.Conversations);
                }
                // Return conversations
                deferred.resolve(order(data.Conversations, 'Time')); // We order data also
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
        var context = tools.cacheContext(request);

        Message.query(request).$promise.then(function(messages) {
            // Only for cache context
            if(context === true) {
                // Store messages
                storeMessages(messages);
            }

            deferred.resolve(order(messages, 'Time'));
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

        Conversation.get(id).then(function(result) {
            var data = result.data;

            if(data.Code === 1000) {
                var messages = [];

                _.each(data.Messages, function(message) {
                    messages.push(new Message(message));
                });

                storeConversations([data.Conversation]);
                storeMessages(messages);
                deferred.resolve(messages);
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

                conversation.preloaded = true;
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
     * Return message list
     * @param {Object} request
     * @return {Promise}
     */
    api.queryMessages = function(request) {
        var deferred = $q.defer();
        var location = getLocation(request);
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
                return angular.isDefined(message.LabelIDs) && message.LabelIDs.indexOf(location.toString()) !== -1;
            });

            messages = order(messages, 'Time');

            console.info('Number of messages in the cache', messages.length);

            switch(mailbox) {
                case 'label':
                    total = cacheCounters.totalMessage($stateParams.label);
                    break;
                default:
                    total = cacheCounters.totalMessage(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            console.info('Number return by API', total);

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
        var location = getLocation(request);
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
                return angular.isDefined(conversation.LabelIDs) && conversation.LabelIDs.indexOf(location.toString()) !== -1;
            });

            conversations = order(conversations, 'Time');

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
                    console.info('Correct number in the cache');
                    deferred.resolve(conversations);
                } else {
                    console.info('Not the correct number in the cache'); // TODO remove it
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
        var conversation = _.findWhere(conversationsCached, {ID: conversationId});
        var callApi = function() {
            deferred.resolve(queryConversationMessages(conversationId));
        };

        if(angular.isDefined(conversation)) {
            var messages = _.where(messagesCached, {ConversationID: conversationId});

            if(conversation.NumMessages === messages.length) {
                deferred.resolve(order(messages, 'Time'));
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
        return angular.copy(_.where(messagesCached, {ConversationID: conversationId}));
    };

    api.getConversationCached = function(conversationId) {
        return _.findWhere(conversationsCached, {ID: conversationId});
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
    * Delete message in the cache if the message is present
    * @param {Object} event
    */
    api.deleteMessage = function(event) {
        console.log('deleteMessage');
        var deferred = $q.defer();

        // Delete message
        messagesCached = _.reject(messagesCached, function(message) {
            return message.ID === event.ID;
        });

        deferred.resolve();

        return deferred.promise;
    };

    /**
     * Delete conversation
     * @param {Object} event
     * @return {Promise}
     */
    api.deleteConversation = function(event) {
        var deferred = $q.defer();

        // Delete messages
        messagesCached = _.reject(messagesCached, function(message) {
            return message.ConversationID === event.ID;
        });

        // Delete conversation
        conversationsCached = _.reject(conversationsCached, function(conversation) {
            return conversation.ID === event.ID;
        });

        deferred.resolve();

        return deferred.promise;
    };

    /**
    * Remove conversations from cache location
    * @param {String} location
    */
    api.empty = function(location) {
        var toRemove = [];

        _.each(conversationsCached, function(conversation, index) {
            if(conversation.LabelIDs.indexOf(location) !== -1) {
                messagesCached = _.reject(messagesCached, function(message) {
                    return message.ConversationID === conversation.ID;
                });

                toRemove.push(index);
            }
        });

        _.each(toRemove, function(index) {
            conversationsCached[index].LabelIDs = _.without(conversationsCached[index].LabelIDs, location);
        });

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
            sent: queryMessages(requestSent)
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
        var conversation = {ID: event.Message.ConversationID, Time: event.Message.Time};

        // Update conversation with Time
        updateConversation(conversation);
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
            var messages = api.queryMessagesCached(event.ID);
            var message = _.max(messages, function(message){ return message.Time; });

            event.Conversation.Time = message.Time;
            event.Conversation.LabelIDs = message.LabelIDs;
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

            _.extend(message, current, event.Message);

            if(JSON.stringify(message) === JSON.stringify(current)) {
                deferred.resolve();
            } else {
                // Manage labels
                if(angular.isDefined(event.Message.LabelIDsAdded)) {
                    message.LabelIDs = _.uniq(message.LabelIDs.concat(event.Message.LabelIDsAdded));
                    delete message.LabelIDsAdded;
                }

                if(angular.isDefined(event.Message.LabelIDsRemoved)) {
                    message.LabelIDs = _.difference(message.LabelIDs, event.Message.LabelIDsRemoved);
                    delete message.LabelIDsRemoved;
                }

                messagesCached[index] = message;
                manageCounters(current, messagesCached[index], 'message');
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

             _.extend(conversation, current, event.Conversation);

             // Manage labels
             if(angular.isDefined(event.Conversation.LabelIDsAdded)) {
                 conversation.LabelIDs = _.uniq(conversation.LabelIDs.concat(event.Conversation.LabelIDsAdded));
                 delete conversation.LabelIDsAdded;
             }

             if(angular.isDefined(event.Conversation.LabelIDsRemoved)) {
                 conversation.LabelIDs = _.difference(conversation.LabelIDs, event.Conversation.LabelIDsRemoved);
                 delete conversation.LabelIDsRemoved;
             }

             // Update conversation cached
             conversationsCached[index] = conversation;
             manageCounters(current, conversationsCached[index], 'conversation');
             deferred.resolve();
         } else if(angular.isDefined(event.Conversation)) {
            // Create a new conversation in the cache
            api.createConversation(event).then(function() {
                deferred.resolve();
            });
         }

         return deferred.promise;
     };

    /**
    * Manage the cache when a new event comes
    * @param {Array} events
    */
    api.events = function(events, type) {
        var promises = [];

        console.log(events, type);

        _.each(events, function(event) {
            if(type === 'message') {
                switch (event.Action) {
                    case DELETE:
                        promises.push(api.deleteMessage(event));
                        break;
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
            } else if(type === 'conversation') {
                switch (event.Action) {
                    case DELETE:
                        promises.push(api.deleteConversation(event));
                        break;
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
        });
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

        if(angular.isDefined($stateParams.id)) {
            $rootScope.$broadcast('refreshConversation');
            $rootScope.$broadcast('refreshMessage');
        }
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
        var location = tools.currentLocation();
        var request = {PageSize: 1, Label: location};

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
    //     location: {
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
    var exist = function(location) {
        if(angular.isUndefined(counters[location])) {
            counters[location] = {
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
            _.each(result.message.Counts, function(counter) {
                exist(counter.LabelID);
                counters[counter.LabelID].message.total = counter.Total || 0;
                counters[counter.LabelID].message.unread = counter.Unread || 0;
            });

            _.each(result.conversation.data.Counts, function(counter) {
                exist(counter.LabelID);
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
    * Update the total / unread for a specific location
    * @param {String} location
    * @param {Integer} total
    * @param {Integer} unread
    */
    api.updateMessage = function(location, total, unread) {
        exist(location);

        if(angular.isDefined(total)) {
            counters[location].message.total = total;
        }

        if(angular.isDefined(unread)) {
            counters[location].message.unread = unread;
        }

        $rootScope.$broadcast('updatePageName');
    };

    /**
     * Update the total / unread for a specific location
     * @param {String} location
     * @param {Integer} total
     * @param {Integer} unread
     */
    api.updateConversation = function(location, total, unread) {
        exist(location);

        if(angular.isDefined(total)) {
            counters[location].conversation.total = total;
        }

        if(angular.isDefined(unread)) {
            counters[location].conversation.unread = unread;
        }

        $rootScope.$broadcast('updatePageName');
    };

    /**
    * Get the total of messages for a specific location
    * @param {String} location
    */
    api.totalMessage = function(location) {
        return counters[location] && counters[location].message && counters[location].message.total;
    };

    /**
    * Get the total of conversation for a specific location
    * @param {String} location
    */
    api.totalConversation = function(location) {
        return counters[location] && counters[location].conversation && counters[location].conversation.total;
    };

    /**
    * Get the number of unread messages for the specific location
    * @param {String} location
    */
    api.unreadMessage = function(location) {
        return counters[location] && counters[location].message && counters[location].message.unread;
    };

    /**
    * Get the number of unread conversation for the specific location
    * @param {String} location
    */
    api.unreadConversation = function(location) {
        return counters[location] && counters[location].conversation && counters[location].conversation.unread;
    };

    /**
    * Clear location counters
    * @param {String} location
    */
    api.empty = function(location) {
        if(angular.isDefined(counters[location])) {
            counters[location] = {
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
                    var messageEvent = [];

                    _.each(elementsExpired, function(message) {
                        messageEvent.push({Action: 0, ID: message.ID});
                    });

                    cache.events(messageEvent, 'message');
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
