angular.module("proton.cache", [])

.service("cacheMessages", function(
    $q,
    $rootScope,
    $state,
    $stateParams,
    authentication,
    CONSTANTS,
    Message,
    cacheCounters,
    networkActivityTracker
) {
    var api = {};
    var cache = {};
    // {
    //     0: [MsgID, MsgID, MsgID], // inbox folder
    //     2: [MsgID, MsgID, MsgID] // sent folder
    // }
    var hash = {};
    // {
    //     MsgID: [metadata/message],
    //     MsgID: [metadata/message],
    //     MsgID: [metadata/message],
    //     MsgID: [metadata/message]
    // }
    var DELETE = 0;
    var CREATE = 1;
    var UPDATE_DRAFT = 2;
    var UPDATE_FLAG = 3;
    var METADATA = 4;
    var MESSAGE = 5;
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
    * Insert message in a specific cache location, if it's possible
    * @param {String} location
    * @param {Object} message
    */
    var insert = function(location, message) {
        if(angular.isDefined(cache[location])) {
            if(cache[location].indexOf(message.ID) === -1) {
                var index;
                var messages = [];

                for (var i = 0; i < cache[location].length; i++) {
                    var id = cache[location][i];

                    messages.push(hash[id]);
                }

                if(messages.length > 0) {
                    var first = _.first(messages);
                    var last = _.last(messages);

                    if(message.Time < first.Time && message.Time > last.Time) {
                        // Search the correct location
                        index = _.sortedIndex(messages, message, function(element) {
                            return -element.Time;
                        });

                        // Insert the new message
                        cache[location].splice(index, 0, message.ID);
                    } else if(message.Time > first.Time) {
                        cache[location].unshift(message.ID);
                    }
                } else {
                    cache[location].push(message.ID);
                }
            }
        }
    };

    /**
     * Update or create message Resource stored in hash
     * @param {String} id
     * @param {Object} message
     */
    var updateHash = function(id, message) {
        var datas = _.omit(message, 'LabelIDsAdded', 'LabelIDsRemoved');

        if(angular.isDefined(hash[id])) {
            _.extend(hash[id], datas);
        } else {
            hash[id] = datas;
        }
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
    var remove = function(location, message) {
        if(angular.isDefined(cache[location])) {
            cache[location] = _.without(cache[location], message.ID);
        }
    };

    /**
    * Check if the message is located in the cache and return the location
    * @param {String} id - message ID searched
    * @return {Boolean}
    */
    var inCache = function(id) {
        return angular.isDefined(hash[id]);
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

    var getLocation = function(request) {
        var location = request.Location;

        // starred case
        if(angular.isDefined(request.Starred)) {
            location = 5;
        }

        // label case
        if(angular.isDefined(request.Label)) {
            location = request.Label;
        }

        return location;
    };

    /**
    * Call the API to get messages
    * @param {Object} request
    * @return {Promise}
    */
    var queryMessages = function(request) {
        var deferred = $q.defer();

        Message.query(request).$promise.then(function(json) {
            if(angular.isDefined(request.Location)) {
                cacheCounters.update(request.Location, json.Total);
            } else if(angular.isDefined(request.Starred)) {
                cacheCounters.update(CONSTANTS.MAILBOX_IDENTIFIERS.starred, json.Total);
            } else if(angular.isDefined(request.Label)) {
                cacheCounters.update(request.Label, json.Total);
            }

            api.store(request, json.Messages);

            deferred.resolve(json.Messages);
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
            api.updateFlag({ ID: message.ID, Message: message });
            deferred.resolve(message);
        });

        return deferred.promise;
    };

    /**
    * Return messages with request specified
    * @param {Object} request
    * @return {Promise}
    */
    api.query = function(request) {
        var deferred = $q.defer();
        var location = getLocation(request);
        var callApi = function() {
            deferred.resolve(queryMessages(request));
        };

        // In cache context?
        if(cacheContext(request)) {
            var page = request.Page || 0;
            var start = page * CONSTANTS.MESSAGES_PER_PAGE;
            var end = start + CONSTANTS.MESSAGES_PER_PAGE;

            // Location defined?
            if(angular.isDefined(cache[location])) {
                var total;
                var number;
                var mailbox = $state.current.name.replace('secured.', '').replace('.list', '').replace('.view', '');

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

                // Supposed total equal to the total cache?
                if(cache[location].slice(start, end).length === number) {
                    var messages = [];
                    var cached = cache[location].slice(start, end);

                    for (var i = 0; i < cached.length; i++) {
                        var id = cached[i];

                        messages.push(hash[id]);
                    }

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
    * Return the message specified by the id from the cache or the back-end
    * @param {String} id
    * @return {Promise}
    */
    api.get = function(id) {
        var deferred = $q.defer();
        var result = inCache(id);

        if(result === true) {
            var message = hash[id];

            if(angular.isDefined(message.Body)) {
                var m = new Message(message);

                deferred.resolve(m);
            } else {
                deferred.resolve(getMessage(id));
            }
        } else {
            deferred.resolve(getMessage(id));
        }

        return deferred.promise;
    };

    /**
    * Save messages in cache location
    * @param {Object} request
    * @param {Array} messages
    */
    api.store = function(request, messages) {
        delete request.PageSize; // Remove PageSize to valid cacheContext

        var page = request.Page || 0;
        var index = page * CONSTANTS.MESSAGES_PER_PAGE;
        var howmany = messages.length;
        var location = getLocation(request);
        var context = cacheContext(request);
        var messageIDs = _.map(messages, function(message) { return message.ID; });

        exist(location);

        if(context && messages.length > 0) {
            // store message ids order in cache
            Array.prototype.splice.apply(cache[location], [index, howmany].concat(messageIDs));

            // store metadata in hash
            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];

                updateHash(message.ID, message);
            }
        }
    };

    /**
    * Delete message in the cache if the message is present
    * @param {Object} event
    */
    api.delete = function(event) {
        var deferred = $q.defer();
        var locations = Object.keys(cache);
        var result = inCache(event.ID);

        if(result === true) {
            // delete in cache
            _.each(locations, function(location) {
                cache[location] = _.filter(cache[location], function(id) {
                    return id !== event.ID;
                });
            });
            // delete hash
            delete hash[event.ID];
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
    * Remove page from cache location
    * @param {String} location
    */
    api.clearLocation = function(location) {
        if(angular.isDefined(cache[location])) {
            delete cache[location];
            cache[location] = [];
        }
    };

    /**
    * We autoload on login inbox (first 2 pages) and sent (first page)
    */
    api.preloadInboxAndSent = function() {
        var mailbox = $state.current.name.replace('secured.', '').replace('.list', '').replace('.view', '');
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
            inbox: queryMessages(requestInbox),
            sent: queryMessages(requestSent)
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
        if(labels.length > 0) {
            for (var i = 0; i < labels.length; i++) {
                var labelId = labels[i];

                insert(labelId, message);
            }
        }

        updateHash(message.ID, message);

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
                updateHash(event.ID, event.Message);
                reorder(location);
            } else {
                insert(location, event.Message);
                updateHash(event.ID, event.Message);
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

                var oldTotalVector = vector(message, false);
                var oldUnreadVector = vector(message, true);
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
    };

    /**
     * Reset cache and hash then preload inbox and sent
     */
    api.reset = function() {
        cache = {};
        hash = {};
        api.preloadInboxAndSent();
    };

    /**
     * Manage expiration time for messages in the cache
     */
    api.expiration = function() {
        var now = Date.now() / 1000;
        var removed = 0;
        var locations = Object.keys(cache);

        _.each(locations, function(location) {
            var messages = [];

            for (var i = 0; i < cache[location].length; i++) {
                var id = cache[location][i];

                messages.push(hash[id]);
            }

            if(messages.length > 0) {
                messages = _.filter(messages, function(message) {
                    var expTime = message.ExpirationTime;
                    var response = (expTime !== 0 && expTime < now) ? false : true;

                    if (!response) {
                        removed++;
                    }

                    return response;
                });

                cache[location] = _.map(messages, function(message) { return message.ID; });
            }
        });

        if (removed > 0) {
            api.callRefresh();
        }
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
            _.each([0, 1, 2, 3, 4, 5, 6], function(location) {
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
            cacheMessages.get(message.ID); // Shutdown the preload
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
