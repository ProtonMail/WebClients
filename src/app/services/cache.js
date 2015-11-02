angular.module("proton.cache", [])

.service("cacheMessages", function(
    $q,
    $rootScope,
    $state,
    $stateParams,
    authentication,
    CONSTANTS,
    Conversation,
    Message,
    cacheCounters,
    networkActivityTracker
) {
    var api = {};
    var messagesCached = [];
    var conversationsCached = [];
    var DELETE = 0;
    var CREATE = 1;
    var UPDATE_DRAFT = 2;
    var UPDATE_FLAG = 3;
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
    var vector = function(message, unread) {
        var result = {};
        var condition = true;

        if(unread === true) {
            condition = message.IsRead === 0;
        }

        // folders case
        _.each([0, 1, 2, 3, 4, 6], function(location) {
            result[location] =  Number(message.Location === location && condition);
        });

        // starred case
        result[CONSTANTS.MAILBOX_IDENTIFIERS.starred] = Number(message.Starred === 1 && condition);

        // labels case
        if(authentication.user.Labels && authentication.user.Labels.length > 0) {
            _.each(authentication.user.Labels, function(label) {
                result[label.ID] = Number(message.LabelIDs.indexOf(label.ID) !== -1 && condition);
            });
        }

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
        console.log('storeConversations', conversations);
        _.each(conversations, function(conversation) {
            var current = _.findWhere(conversationsCached, {ID: conversation.ID});

            if(angular.isDefined(current)) {
                var index = conversationsCached.indexOf(current);

                _.extend(conversationsCached[index], conversation);
            } else {
                conversationsCached.push(conversation);
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
            message.conversationId = conversationId;

            if(angular.isDefined(current)) {
                var index = messagesCached.indexOf(current);

                _.extend(messagesCached[index], message);
            } else {
                messagesCached.push(message);
            }
        });
    };

    /**
     * Manage the updating to calcultate the total number of messages and unread messages
     * @param {Object} oldMessage
     * @param {Object} newMessage
     */
    var manageCounters = function(oldMessage, newMessage) {
        var oldTotalVector = vector(oldMessage, false);
        var oldUnreadVector = vector(oldMessage, true);
        var newTotalVector = vector(newMessage, false);
        var newUnreadVector = vector(newMessage, true);
        var keys = Object.keys(oldTotalVector);

        _.each(keys, function(location) {
            var currentTotal = cacheCounters.total(location);
            var currentUnread = cacheCounters.unread(location);
            var deltaTotal = newTotalVector[location] - oldTotalVector[location];
            var deltaUnread = newUnreadVector[location] - oldUnreadVector[location];

            cacheCounters.update(
                location,
                currentTotal + deltaTotal,
                currentUnread + deltaUnread
            );
        });
    };

    /**
    * Insert message in a specific cache location, if it's possible
    * @param {String} conversationId
    * @param {Object} message
    */
    var insertMessage = function(conversationId, message) {
        message.conversationId = conversationId;

        messagesCached.push(message);
    };

    /**
     * Insert conversation in conversationsCached
     * @param {Object} conversation
     */
    var insertConversation = function(conversation) {
        conversationsCached.push(conversation);
    };

    /**
     * Reorder cache location by reverse time
     * @param {String} location
     */
    var reorder = function(location) {
        if(angular.isDefined(cache[location])) {
            var messages = [];

            for (var i = 0; i < cache[location].length; i++) {
                var id = cache[location][i];

                messages.push(hash[id]);
            }

            var asc = _.sortBy(messages, 'Time');
            var desc = asc.reverse();

            cache[location] = _.map(desc, function(message) { return message.ID; });
        }
    };

    /**
    * Remove message ID in a specific cache location
    * @param {String} location
    * @param {Object} message
    */
    var removeMessage = function(location, message) {
        if(angular.isDefined(cache[location])) {
            cache[location] = _.without(cache[location], message.ID);
        }
    };

    /**
    * Create the location in the cache if it not defined
    * @param {String} location
    */
    var exist = function(location) {
        if(angular.isUndefined(cache[location])) {
            cache[location] = [];
        }
    };

    var currentMailbox = function() {
        return $state.current.name.replace('secured.', '').replace('.list', '').replace('.view', '');
    };

    var currentLocation = function() {
        var mailbox = currentMailbox();
        var location;

        switch(mailbox) {
            case 'label':
                location = $stateParams.label;
                break;
            default:
                location = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
                break;
        }

        return location;
    };

    /**
     * Return location specified in the request
     * @param {Object} request
     */
    var getLocation = function(request) {
        console.log('getLocation', request);
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
     * Get conversation from API and store it in the cache
     * @param {String} id
     * @return {Promise}
     */
    var queryMessages = function(id) {
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
     * @param {String} conversationId
     */
    var getConversation = function(conversationId) {
        var deferred = $q.defer();

        Conversation.get(conversationId).then(function(result) {
            var data = result.data;

            if(data.Code === 1000) {
                storeConversations([data.Conversation]);
                storeMessages(data.Conversation.ID, data.Messages);
                deferred.resolve(data.Conversation);
            } else {
                deferred.reject();
            }
        });

        networkActivityTracker.track(deferred.promise);

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
            storeMessages([message]);
            deferred.resolve(message);
        });

        return deferred.promise;
    };

    /**
    * Return conversation list with request specified in cache or call api
    * @param {Object} request
    * @return {Promise}
    */
    api.queryConversations = function(request) {
        console.log('api.queryConversations');
        var deferred = $q.defer();
        var location = getLocation(request);
        var callApi = function() {
            console.log('callApi');
            deferred.resolve(queryConversations(request));
        };

        // In cache context?
        if(cacheContext(request)) {
            var page = request.Page || 0;
            var start = page * CONSTANTS.MESSAGES_PER_PAGE;
            var end = start + CONSTANTS.MESSAGES_PER_PAGE;
            var total;
            var number;
            var mailbox = currentMailbox();
            var conversations = _.filter(conversationsCached, function(conversation) {
                return conversation.LabelIDs.indexOf(location + '') !== -1;
            });

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
            console.log('conversations.length === number', conversations.length, number);

            // Supposed total equal to the total cache?
            if(conversations.length === number) {
                deferred.resolve(conversations);
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
    api.queryMessages = function(conversationId) {
        console.log('api.queryMessages');
        var deferred = $q.defer();
        var conversation = _.findWhere(conversationsCached, {ID: conversationId});
        var callApi = function() {
            deferred.resolve(queryMessages(conversationId));
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
        console.log('api.getConversation');
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
    * Return the message specified by the id from the cache or the back-end
    * @param {String} ID - Message ID
    * @return {Promise}
    */
    api.getMessage = function(ID) {
        console.log('api.getMessage');
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

        messagesCached = _.filter(messagesCached, function(message) {
            return message.ID !== event.ID;
        });

        deferred.resolve();

        return deferred.promise;
    };

    api.deleteConversation = function(event) {
        var deferred = $q.defer();

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
                    return message.conversationId !== conversation.ID;
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
        var mailbox = currentMailbox();
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
            sent: queryConversations(requestSent)
        }).then(function() {
            deferred.resolve();
        });

        return deferred.promise;
    };

    /**
    * Add a new message in the cache
    * @param {Object} event
    */
    api.create = function(event) {
        var deferred = $q.defer();
        var message = event.Message;
        var location = message.Location;
        var starred = message.Starred === 0;
        var labels = message.LabelIDs;

        // folders
        insert(location, message);

        // starred
        if(starred) {
            insert(CONSTANTS.MAILBOX_IDENTIFIERS.starred, message);
        }

        // labels
        if(labels && labels.length > 0) {
            for (var i = 0; i < labels.length; i++) {
                var labelId = labels[i];

                insert(labelId, message);
            }
        }

        // updateHash(message.ID, message);

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

        if(angular.isDefined(cache[location])) {
            var index = cache[location].indexOf(event.ID);

            if(index !== -1) {
                // updateHash(event.ID, event.Message);
                reorder(location);
            } else {
                insert(location, event.Message);
                // updateHash(event.ID, event.Message);
            }
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
    * Update message attached to the id specified
    * @param {Object} event
    * @return {Promise}
    */
    api.updateFlag = function(event) {
        var deferred = $q.defer();
        var result = inCache(event.ID);

        // Present in the current cache?
        if(result === true) {
            var message = hash[event.ID];
            var newMessage = {};

            _.extend(newMessage, message, event.Message);

            if(JSON.stringify(message) === JSON.stringify(newMessage)) {
                deferred.resolve();
            } else {
                var previousLocation = message.Location;
                var newLocation = newMessage.Location;
                var sameLocation = previousLocation === newLocation;
                var sameStarred = message.Starred === newMessage.Starred;

                // Manage labels
                if(angular.isDefined(newMessage.LabelIDsAdded)) {
                    newMessage.LabelIDs = _.uniq(message.LabelIDs.concat(newMessage.LabelIDsAdded));

                    _.each(newMessage.LabelIDsAdded, function(labelId) {
                        insert(labelId, message);
                    });
                }

                if(angular.isDefined(newMessage.LabelIDsRemoved)) {
                    newMessage.LabelIDs = _.difference(message.LabelIDs, newMessage.LabelIDsRemoved);

                    _.each(newMessage.LabelIDsRemoved, function(labelId) {
                        remove(labelId, message);
                    });
                }

                var sameLabels = message.LabelIDs === newMessage.LabelIDs;

                if(sameLocation === false) {
                    // remove message in the previous location
                    remove(previousLocation, message);
                    // insert message in the new location
                    insert(newLocation, message);
                }

                if(sameStarred === false) {
                    if(newMessage.Starred === 0) {
                        // remove message in the starred folder
                        remove(CONSTANTS.MAILBOX_IDENTIFIERS.starred, message);
                    } else {
                        // insert message in the starred folder
                        insert(CONSTANTS.MAILBOX_IDENTIFIERS.starred, message);
                    }
                }

                if($rootScope.dontUpdateNextCounter === true) {
                    $rootScope.dontUpdateNextCounter = false;
                } else {
                    manageCounters(message, newMessage);
                }

                updateHash(event.ID, newMessage);

                deferred.resolve();
            }
        } else if(angular.isDefined(event.Message)) {
            // Create a new message in the cache
            api.create(event);
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
    * Manage the cache when a new event comes
    * @param {Array} events
    */
    api.events = function(events) {
        var promises = [];

        _.each(events, function(event) {
            switch (event.Action) {
                case DELETE:
                    promises.push(api.delete(event));
                    break;
                case CREATE:
                    promises.push(api.create(event));
                    break;
                case UPDATE_DRAFT:
                    promises.push(api.updateDraft(event));
                    break;
                case UPDATE_FLAG:
                    promises.push(api.updateFlag(event));
                    break;
                default:
                    break;
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
        $rootScope.$broadcast('refreshMessages');
        $rootScope.$broadcast('refreshCounters');
        $rootScope.$broadcast('updatePageName');

        if(angular.isDefined($stateParams.id)) {
            $rootScope.$broadcast('refreshMessage');
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
    api.more = function(conversationId, location, type) {
        var deferred = $q.defer();
        var request = {PageSize: 1, ID: message.ID};

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
            if(conversation) {
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

.service('preloadMessage', function(
    $interval,
    cacheMessages
) {
    var api = {};
    var queue = [];
    var interval = 5000; // 15 seconds // TODO edit

    /**
    * Set current messages viewed
    * @param {Array} messages
    */
    api.set = function(messages) {
        api.reset();
        api.add(messages); // Add unread messages to the queue
    };

    /**
    * Reset current queue
    */
    api.reset = function() {
        queue = [];
    };

    /**
    * Add unread messages to the queue
    * @param {Array} messages
    */
    api.add = function(messages) {
        // Add only unread messages to the queue
        // Filter by message where the Body is undefined
        queue = _.union(queue, _.where(messages, { IsRead: 0, Body: undefined }));
    };

    /**
    * Preload messages present in the queue
    */
    api.preload = function() {
        // Get the first message in the queue
        var message  = _.first(queue);

        if(angular.isDefined(message)) {
            // Preload the first message
            cacheMessages.getMessage(message.ID); // Shutdown the preload
            // Remove the first message in the queue
            queue = _.without(queue, message);
        }
    };

    /**
    * Loop around messages present in the queue to preload the Body
    */
    api.loop = function() {
        var looping = $interval(function() {
            api.preload();
        }, interval);
    };

    api.loop(); // Start looping

    return api;
});
