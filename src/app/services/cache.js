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
    var DELETE = 0;
    var CREATE = 1;
    var UPDATE = 2;
    var UPDATE_FLAG = 3;
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
     */
    var cacheContext = function(request) {
        var result = Object.keys(request).length === 2 && angular.isDefined(request.Page) && angular.isDefined(request.Location);

        return result;
    };

    /**
     * Check if the message is located in the cache and return the location
     * @param {Integer} id - message ID searched
     */
    var inCache = function(id) {
        var keys = Object.keys(cache);
        var result = false;

        _.each(keys, function(key) {
            if(_.where(cache[key], { ID: id }).length > 0) {
                result = key;
            }
        });

        return result;
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

    /**
     * Call the API to get messages
     * @param {Object} request
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
     */
    var getMessage = function(id) {
        var deferred = $q.defer();

        Message.get({ id: id }).$promise.then(function(message) {
            api.update({ ID: message.ID, Message: message });
            deferred.resolve(message);
        });

        return deferred.promise;
    };

    /**
     * Return messages with request specified
     * @param {Object} request
     */
    api.query = function(request) {
        var deferred = $q.defer();
        var location = request.Location;
        var callApi = function() {
            deferred.resolve(queryMessages(request));
        };

        // In cache context?
        if(cacheContext(request)) {
            var page = request.Page || 0;
            var start = page * CONSTANTS.MESSAGES_PER_PAGE;
            var end = start + CONSTANTS.MESSAGES_PER_PAGE;

            // Messages present in the cache?
            if(angular.isDefined(cache[location]) && angular.isDefined($rootScope.messageTotals)) {
                // var total;
                // var totalPage;
                //
                // switch($state.current.name) {
                //     case 'secured.labels':
                //         total = $rootScope.messageTotals.Locations[$stateParams.label];
                //         break;
                //     case 'secured.starred':
                //         total = $rootScope.messageTotals.Starred;
                //         break;
                //     default:
                //         total = $rootScope.messageTotals.Locations[CONSTANTS.MAILBOX_IDENTIFIERS[$state.current.name.replace('secured.', '')]];
                //         break;
                // }
                //
                // totalPage = (total + CONSTANTS.MESSAGES_PER_PAGE - 1) / CONSTANTS.MESSAGES_PER_PAGE;

                if(cache[location].slice(start, end).length === CONSTANTS.MESSAGES_PER_PAGE) {
                    deferred.resolve(cache[location].slice(start, end));
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
     */
    api.get = function(id) {
        var deferred = $q.defer();
        var location = inCache(id);

        if(location !== false) {
            var message = _.findWhere(cache[location], { ID: id });

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
        var location = request.Location;
        var context = cacheContext(request);

        exist(location);

        if(context && messages.length > 0) {
            // Store messages at the correct placement
            Array.prototype.splice.apply(cache[location], [index, howmany].concat(messages));
        }
    };

    /**
     * Delete message in the cache if the message is present
     * @param {Object} event
     */
    api.delete = function(event) {
        var deferred = $q.defer();
        var keys = Object.keys(cache);

        _.each(keys, function(key) {
            cache[key] = _.filter(cache[key], function(message) { return message.ID !== event.ID; });
        });

        deferred.resolve();

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
        var index;

        exist(location);

        index = _.sortedIndex(cache[location], message, function(element) {
            return -element.Time;
        });

        cache[location].splice(index, 0, message);
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
        var location = inCache(event.ID);

        // Present in the current cache?
        if(location !== false) {
            var index = _.findIndex(cache[location], function(message) { return message.ID === event.ID; });
            var sameLocation = cache[location][index].Location === event.Message.Location;
            var currentMessage = cache[location][index];

            // Manage labels
            if(angular.isDefined(event.Message.LabelIDsAdded)) {
                event.Message.LabelIDs = _.uniq(currentMessage.LabelIDs.concat(event.Message.LabelIDsAdded));
            }

            if(angular.isDefined(event.Message.LabelIDsRemoved)) {
                event.Message.LabelIDs = _.difference(currentMessage.LabelIDs, event.Message.LabelIDsRemoved);
            }

            if(sameLocation) {
                // Just update the message
                cache[location][index] = _.extend(currentMessage, event.Message);
                deferred.resolve();
            } else {
                // NOTE The difficult case!!!
                // Remove the message in the current location
                api.delete(event);

                // If the location exist only
                // we avoid a problem when we will go to this new folder because the other data doesn't exist yet
                if(angular.isDefined(cache[location])) {
                    // Add the message in the new location
                    event.Message = _.omit(event.Message, ['LabelIDsAdded', 'LabelIDsRemoved']);
                    event.Message = _.extend(currentMessage, event.Message);
                    api.create(event);
                }

                deferred.resolve();
            }
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
                case UPDATE:
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
            console.log('All promises are complete');
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
            cacheMessages.get(message.ID);
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
