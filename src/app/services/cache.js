 angular.module("proton.cache", [])

.service("cacheMessages", function(
    $q,
    $rootScope,
    $state,
    $stateParams,
    CONSTANTS,
    Message,
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
        "ID",
        "Subject",
        "IsRead",
        "SenderAddress",
        "SenderName",
        "ToList",
        "Time",
        "Size",
        "Location",
        "Starred",
        "HasAttachment",
        "IsEncrypted",
        "ExpirationTime",
        "IsReplied",
        "IsRepliedAll",
        "IsForwarded",
        "AddressID",
        "LabelIDs"
    ];

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

        Message.query(request).$promise.then(function(messages) {
            api.store(request, messages);
            deferred.resolve(messages);
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
            // api.updateFlag({ ID: message.ID, Message: message });
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
                        total = $rootScope.messageTotals.Labels[$stateParams.label];
                        break;
                    case 'starred':
                        total = $rootScope.messageTotals.Starred;
                        break;
                    default:
                        total = $rootScope.messageTotals.Locations[CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
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
                deferred.resolve(message);
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

                hash[message.ID] = message;
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

        // delete in cache
        _.each(locations, function(location) {
            cache[location] = _.filter(cache[location], function(id) {
                return id !== event.ID;
            });
        });

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
         var deferred = $q.defer();
         var requestInbox;
         var requestSent;

         api.queryMessages();

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
        var insert = function(location, message) {
            if(angular.isDefined(cache[location])) {
                var index;
                var messages = [];

                for (var i = 0; i < cache[location].length; i++) {
                    var id = cache[location][i];

                    messages.push(hash[id]);
                }

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
            }
        };

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

        hash[message.ID] = _.extend(hash[message.ID] || {}, message);

        deferred.resolve();

        return deferred.promise;
    };

    /**
     * Update only a draft message
     * @param {Object} event
     */
    api.updateDraft = function(event) {
        var drafts = CONSTANTS.MAILBOX_IDENTIFIERS.drafts;
        var deferred = $q.defer();

        // Draft cache is defined?
        if(angular.isDefined(cache[drafts])) {
            var index = _.findIndex(cache[drafts], function(message) { return message.ID === event.ID; });
            var currentMessage = cache[location][index];

            if(index !== -1) {
                cache[drafts][index] = _.extend(currentMessage, event.Message);
            }
        }

        deferred.resolve();

        return deferred.promise;
    };

    /**
     * Update message attached to the id specified
     * @param {Object} event
     */
    api.updateFlag = function(event) {
        var deferred = $q.defer();
        var result = inCache(event.ID);

        // Present in the current cache?
        if(result === true) {
            var message = hash[event.ID];
            var sameLocation = message.Location === event.Message.Location;
            var remove = function(location, message) {
                if(angular.isDefined(cache[location])) {
                    cache[location] = _.without(cache[location], message.ID);
                }
            };

            // Manage labels
            if(angular.isDefined(event.Message.LabelIDsAdded)) {
                event.Message.LabelIDs = _.uniq(message.LabelIDs.concat(event.Message.LabelIDsAdded));
            }

            if(angular.isDefined(event.Message.LabelIDsRemoved)) {
                event.Message.LabelIDs = _.difference(message.LabelIDs, event.Message.LabelIDsRemoved);

                _.each(event.Message.LabelIDsRemoved, function(labelId) {
                    remove(cache[labelId], message);
                });
            }

            var sameLabels = message.LabelIDs === event.Message.LabelIDs;
            var sameStarred = message.Starred === event.Message.Starred;

            if(sameLocation === false) {
                remove(message.Location, message);
            }

            if(sameStarred === false) {
                remove(cache[CONSTANTS.MAILBOX_IDENTIFIERS.starred], message);
            }

            hash[event.ID] = _.extend(message, event.Message);

            deferred.resolve();
        } else {
            getMessage(event.ID).then(function(message) {
                event.Message = message;
                // Create a new message in the cache
                api.create(event);
                deferred.resolve();
            }, function(error) {
                deferred.reject(error);
            });
        }

        return deferred.promise;
    };

    /**
     * Manage the cache when a new event comes
     */
    api.events = function(events) {
        var promises = [];

        _.each(events, function(event) {
            console.log(event);
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
    };

    return api;
})

.service("preloadMessage", function(
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
