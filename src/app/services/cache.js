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
    // Parameters shared between api / cache / message view / message list
    var fields = [
        'AddressID',
        'Body',
        'ExpirationTime',
        'HasAttachment',
        'ID',
        'IsEncrypted',
        'IsForwarded',
        'IsRead',
        'IsReplied',
        'IsRepliedAll',
        'LabelIDs',
        'Location',
        'Selected',
        'SenderAddress',
        'SenderName',
        'Size',
        'Starred',
        'Subject',
        'Time',
        'ToList'
    ];

    /**
     * Return a vector to calculate the counters
     * @param {Object} message - message to analyse
     * @param {Boolean} unread - true if unread case
     * @return {Object}
     */
    var vector = function(message) {
        var result = {};
        var condition = message.IsRead === 0;
        var locations = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

        _.each(locations, function(location) {
            result[location] = Number(message.LabelIDs.indexOf(location) !== -1 && condition);
        });

        return result;
    };

    /**
    * Check if the request is in a cache context
    * @param {Object} request
    * @return {Boolean}
    */
    var cacheContext = function(request) {
        var two = Object.keys(request).length === 2;
        var page = angular.isDefined(request.Page);
        var basic = angular.isDefined(request.Location);
        var starred = angular.isDefined(request.Starred);
        var label = angular.isDefined(request.Label);

        return two && page && (basic || starred || label);
    };

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
     * @param {String} conversationId
     * @param {Array} messages
     */
    var storeMessages = function(conversationId, messages) {
        _.each(messages, function(message) {
            var current = _.findWhere(messagesCached, {ID: message.ID});

            message = new Message(message);

            if(angular.isDefined(current)) {
                var index = messagesCached.indexOf(current);

                _.extend(messagesCached[index], message);
            } else {
                insertMessage(message);
            }
        });
    };

    /**
    * Insert message in a specific cache location, if it's possible
    * @param {Object} message
    */
    var insertMessage = function(message) {
        messagesCached.push(message);
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
     */
    var order = function(elements) {
        return _.sortBy(elements, 'Time').reverse();
    };

    /**
     * Manage the updating to calcultate the total number of messages and unread messages
     * @param {Object} oldMessage
     * @param {Object} newMessage
     */
    var manageCounters = function(oldMessage, newMessage) {
        var oldUnreadVector = vector(oldMessage);
        var newUnreadVector = vector(newMessage);
        var locations = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

        _.each(locations, function(location) {
            var currentUnread = cacheCounters.unread(location);
            var deltaUnread = newUnreadVector[location] - oldUnreadVector[location];

            cacheCounters.update(
                location,
                undefined,
                currentUnread + deltaUnread
            );
        });
    };

    /**
     * Return location specified in the request
     * @param {Object} request
     */
    var getLocation = function(request) {
        var location;

        if(angular.isDefined(request.Location)) {
            location = request.Location;
        } else if(angular.isDefined(request.Starred)) {
            location = CONSTANTS.MAILBOX_IDENTIFIERS.starred;
        } else if(angular.isDefined(request.Label)) {
            location = request.Label;
        }

        return location;
    };

    /**
     * Call API to get the list of conversations
     * @param {Object} request
     * @return {Promise}
     */
    var queryConversations = function(request) {
        var deferred = $q.defer();
        var location = getLocation(request);
        var context = cacheContext(request);

        Conversation.query(request).then(function(result) {
            var data = result.data;

            if(data.Code === 1000) {
                // Set total value in rootScope
                $rootScope.Total = data.Total;
                // Only for cache context
                if(context === true) {
                    // Set total value in cache
                    cacheCounters.update(location, data.Total);
                    // Store conversations
                    storeConversations(data.Conversations);
                }
                // Return conversations
                deferred.resolve(data.Conversations);
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
        var context = cacheContext(request);

        Message.query(request).$promise.then(function(messages) {
            // Only for cache context
            if(context === true) {
                // Store messages
                storeMessages(messages);
            }

            deferred.resolve(messages);
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
                storeMessages(data.Conversation.ID, messages);
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
                storeMessages(conversation.ID, messages);
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
        var context = cacheContext(request);
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
                return message.LabelIDs.indexOf(location.toString()) !== -1;
            });

            messages = order(messages);

            switch(mailbox) {
                case 'label':
                    total = cacheCounters.total($stateParams.label);
                    break;
                default:
                    total = cacheCounters.total(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

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
                console.log('Correct number in the cache');
                deferred.resolve(messages);
            } else {
                console.log('Not the correct number in the cache'); // TODO remove it
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
        var context = cacheContext(request);
        var callApi = function() {
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
                return conversation.LabelIDs.indexOf(location.toString()) !== -1;
            });

            conversations = order(conversations);

            console.log(conversations);

            switch(mailbox) {
                case 'label':
                    total = cacheCounters.total($stateParams.label);
                    break;
                default:
                    total = cacheCounters.total(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            if((total % CONSTANTS.MESSAGES_PER_PAGE) === 0) {
                number = CONSTANTS.MESSAGES_PER_PAGE;
            } else {
                if((Math.ceil(total / CONSTANTS.MESSAGES_PER_PAGE) - 1) === page) {
                    number = total % CONSTANTS.MESSAGES_PER_PAGE;
                } else {
                    number = CONSTANTS.MESSAGES_PER_PAGE;
                }
            }

            conversations = conversations.slice(start, end);

            // Supposed total equal to the total cache?
            if(conversations.length === number) {
                console.log('Correct number in the cache');
                deferred.resolve(conversations);
            } else {
                console.log('Not the correct number in the cache'); // TODO remove it
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
            var messages = _.where(messagesCached, {conversationId: conversationId});

            if(conversation.NumMessages === messages.length) {
                deferred.resolve(messages);
            } else {
                callApi();
            }
        } else {
            callApi();
        }

        return deferred.promise;
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
        var deferred = $q.defer();

        // Delete message
        messagesCached = _.filter(messagesCached, function(message) {
            return message.ID !== event.ID;
        });

        // Delete conversation

        deferred.resolve();

        return deferred.promise;
    };

    api.deleteConversation = function(event) {
        var deferred = $q.defer();

        // Delete messages
        messagesCached = _.filter(messagesCached, function(message) {
            return message.ConversationID !== event.ID;
        });

        // Delete conversation
        conversationsCached = _.filter(conversationsCached, function(conversation) {
            return conversation.ID !== event.ID;
        });

        deferred.resolve();

        return deferred.promise;
    };

    /**
    * Remove page from cache location
    * @param {String} location
    */
    api.clearLocation = function(location) {
        var toDelete = [];

        _.each(conversationsCached, function(conversation, index) {
            if(conversation.LabelIDs.indexOf(location + '')) {
                messagesCached = _.filter(messagesCached, function(message) {
                    return message.ConversationID !== conversation.ID;
                });

                toDelete.push(index);
            }
        });

        _.each(toDelete, function(index) {
            delete conversationsCached[index];
        });
    };

    /**
    * Preload conversations for inbox (first 2 pages) and sent (first page)
    */
    api.preloadInboxAndSent = function() {
        var mailbox = tools.currentMailbox();
        var deferred = $q.defer();
        var requestInbox;
        var requestSent;

        if(mailbox === 'inbox') {
            requestInbox = {Location: 0, Page: 1};
            requestSent = {Location: 2, Page: 0};
        } else if(mailbox === 'sent') {
            requestInbox = {Location: 0, Page: 0, PageSize: 100};
            requestSent = {};
        } else {
            requestInbox = {Location: 0, Page: 0, PageSize: 100};
            requestSent = {Location: 2, Page: 0};
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
        var message = event.Message;
        var currentMessage = _.findWhere(messagesCached, {ID: event.ID});
        var currentConversation = _.findWhere(conversationsCached, {ID: event.Message.ConversationID});
        var conversation = {
            ExpirationTime: event.Message.ExpirationTime,
            ID: event.Message.ConversationID,
            LabelIDs: event.Message.LabelIDs,
            NumAttachments: event.Message.NumAttachments,
            NumMessages: 1,
            NumUnread: event.Message.IsRead,
            Recipients: event.Message.ToList,
            Senders: [event.Message.Sender],
            Subject: event.Message.Subject,
            Time: event.Message.Time,
            TotalSize: event.Message.Size
        };

        if(angular.isUndefined(currentMessage)) {
            insertMessage(message);
        }

        // Need to create a new conversation?
        if(angular.isUndefined(currentConversation)) {
            insertConversation(conversation);
        } else {
            updateConversation(conversation);
        }

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

        if(angular.isUndefined(current)) {
            insertConversation(event.Conversation);
        } else {
            updateConversation(event.Conversation);
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
    * Update only a draft message
    * @param {Object} event
    * @return {Promise}
    */
    api.updateDraft = function(event) {
        var location = CONSTANTS.MAILBOX_IDENTIFIERS.drafts;
        var deferred = $q.defer();
        var message = _.findWhere(messagesCached, {ID: event.ID});

        if(angular.isDefined(message)) {
            var index = messagesCached.indexOf(message);

            _.extend(messagesCached[index], event.Message);
        } else {
            insertMessage(event.Message);
        }

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

                if($rootScope.dontUpdateNextCounter === true) {
                    $rootScope.dontUpdateNextCounter = false;
                } else {
                    manageCounters(current, messagesCached[index]);
                }

                deferred.resolve();
            }
        } else if(angular.isDefined(event.Message)) {
            // Create a new message in the cache
            api.createMessage(event).then(function() {
                deferred.resolve();
            });
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

             conversationsCached[index] = conversation;

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
                        promises.push(api.updateDraft(event));
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
        }
    };

    /**
     * Clear cache and hash
     */
    api.clear = function() {
        cache = {};
        hash = {};
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
     * @param {Object} conversationId
     * @param {String} location
     * @param {String} type - 'next' or 'previous'
     * @return {Promise}
     */
    api.more = function(conversationId, type) {
        var deferred = $q.defer();
        var request = {PageSize: 1, ID: conversationId};
        var location = tools.currentLocation();

        if(type === 'previous') {
            request.Desc = 1;
        } else {
            request.Desc = 0;
        }

        if(location.length > 1) { // label case
            request.Label = location;
        } else if (location === CONSTANTS.MAILBOX_IDENTIFIERS.starred) { // starred case
            request.Starred = 1;
        } else { // others folders
            request.Location = location;
        }

        queryConversations(request).then(function(conversation) {
            if(angular.isArray(conversation) && conversation.length > 0) {
                if(type === 'next') {
                    var first = _.first(conversation);

                    deferred.resolve(first.ID);
                } else if(type === 'previous') {
                    var last = _.last(conversation);

                    deferred.resolve(last.ID);
                }
            } else {
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    return api;
})

.service('cacheCounters', function(Message, CONSTANTS, $q, $rootScope, authentication) {
    var api = {};
    var counters = {};
    // {
    //     location: {
    //         total: value,
    //         unread: value
    //     }
    // }
    var exist = function(location) {
        if(angular.isUndefined(counters[location])) {
            counters[location] = {
                total: 0,
                unread: 0
            };
        }
    };

    /**
    * Query unread and total
    * @return {Promise}
    */
    api.query = function() {
        var deferred = $q.defer();
        var promiseUnread = Message.unreaded().$promise;
        var promiseTotal = Message.totalCount().$promise;

        $q.all({
            unread: promiseUnread,
            total: promiseTotal
        }).then(function(result) {
            // folders case
            _.each([0, 1, 2, 3, 4, 6], function(location) {
                exist(location);
            });
            _.each(result.total.Locations, function(obj) {
                exist(obj.Location);
                counters[obj.Location].total = obj.Count;
            });
            _.each(result.unread.Locations, function(obj) {
                counters[obj.Location].unread = obj.Count;
            });
            // starred case
            exist(CONSTANTS.MAILBOX_IDENTIFIERS.starred);
            counters[CONSTANTS.MAILBOX_IDENTIFIERS.starred].unread = result.unread.Starred;
            counters[CONSTANTS.MAILBOX_IDENTIFIERS.starred].total = result.total.Starred;
            // labels case
            _.each(authentication.user.Labels, function(label) {
                exist(label.ID);
            });
            _.each(result.unread.Labels, function(obj) {
                counters[obj.LabelID].unread = obj.Count;
            });
            _.each(result.total.Labels, function(obj) {
                counters[obj.LabelID].total = obj.Count;
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
    api.update = function(location, total, unread) {
        exist(location);

        if(angular.isDefined(total)) {
            counters[location].total = total;
        }

        if(angular.isDefined(unread)) {
            counters[location].unread = unread;
        }

        $rootScope.$broadcast('updatePageName');
    };

    /**
    * Get the total of messages for a specific location
    * @param {String} location
    */
    api.total = function(location) {
        return counters[location] && counters[location].total;
    };

    /**
    * Get the number of unread messages for the specific location
    * @param {String} location
    */
    api.unread = function(location) {
        return counters[location] && counters[location].unread;
    };

    /**
    * Clear location counters
    * @param {String} location
    */
    api.empty = function(location) {
        if(angular.isDefined(counters[location])) {
            counters[location] = {
                total: 0,
                unread: 0
            };
        }
    };

    return api;
})

.service('preloadConversation', function(
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

    api.loop(); // Start looping

    return api;
});
