angular.module("proton.cache", [])

.service("cacheMessages", function(
    CONSTANTS,
    Message,
    $q,
    $rootScope,
    $state,
    $stateParams,
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
     * @param {Integer} id
     */
    var getMessage = function(id) {
        var deferred = $q.defer();

        Message.get({ id: id }).$promise.then(function(message) {
            api.update({ Message: message });
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

        // In cache context?
        if(cacheContext(request)) {
            // Messages present in cache?
            var page = request.Page || 0;
            var start = page * CONSTANTS.MESSAGES_PER_PAGE;
            var end = start + CONSTANTS.MESSAGES_PER_PAGE;

            // We can improve this condition: cache[location].slice(start, end).length === CONSTANTS.MESSAGES_PER_PAGE
            if(angular.isDefined(cache[location]) && cache[location].slice(start, end).length === CONSTANTS.MESSAGES_PER_PAGE) {
                var messages = cache[location].slice(start, end);

                deferred.resolve(messages);
            } else {
                // Else we call the API
                deferred.resolve(queryMessages(request));
            }
        } else {
            // Else we call the API
            deferred.resolve(queryMessages(request));
        }

        return deferred.promise;
    };

    /**
     * Return message specified by id
     * @param {Integer} id
     */
    api.get = function(id) {
        return {};
    };

    /**
     * Save messages in cache location
     * @param {Object} request
     * @param {Integer} location Integer
     */
    api.store = function(request, messages) {
        console.log('api.store');
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
     * @param {Object} message
     */
    api.delete = function(event) {
        console.log('api.delete');
        var keys = Object.keys(cache);

        _.each(keys, function(key) {
            cache[key] = _.filter(cache[key], function(message) {
                return message.ID !== event.ID;
             });
        });
    };

    /**
     * Add a new message in the cache
     */
    api.create = function(event) {
        console.log('api.create');
        var message = event.Message;
        var location = message.Location;
        var index;

        exist(location);

        index = _.sortedIndex(cache[location], message, function(element) {
            return -element.Time;
        });

        cache[location].splice(index, 0, message);
    };

    /**
     * Update message attached to the id specified
     * @param {Integer} id
     * @param {Object} message
     * @param {Integer} location
     */
    api.update = function(event) {
        console.log('api.update');
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
                cache[location][index] = _.extend(currentMessage, event.Message);
            } else {
                // Remove the message in the current location
                api.delete(event);

                event.Message = _.omit(event.Message, ['LabelIDsAdded', 'LabelIDsRemoved']);
                // Add the message in the new location
                event.Message = _.extend(currentMessage, event.Message);
                api.create(event);
            }
        } else {
            getMessage(event.ID).then(function() {
                // Create a new message in the cache
                api.create(event);
                // Force refresh in this special case
                api.refreshMessages();
            });
        }
    };

    /**
     * Manage the cache when a new event comes
     */
    api.events = function(events) {
        _.each(events, function(event) {
            switch (event.Action) {
                case DELETE:
                    console.log('DELETE', event);
                    api.delete(event);
                    break;
                case CREATE:
                    console.log('CREATE', event);
                    api.create(event);
                    break;
                case UPDATE:
                    console.log('UPDATE', event);
                    api.update(event);
                    break;
                case UPDATE_FLAG:
                    console.log('UPDATE_FLAG', event);
                    api.update(event);
                    break;
                default:
                    break;
            }
        });

        api.refreshMessages();
    };

    /**
     * Ask to the message list controller to refresh the messages
     */
    api.refreshMessages = function() {
        $rootScope.$broadcast('refreshMessagesCache');
    };

    return api;
})

.service("preloadMessageContent", function($interval, Message, cacheMessages) {
    var api = {};
    var messages = [];
    var queue = [];
    var interval = 15000; // 15 seconds

    /**
     * Set current messages viewed
     * @param {Array} messages
     */
    api.set = function(messages) {
        messages = messages; // Set messages
        api.add(); // Add unread messages to the queue
    };

    /**
     * Reset current queue
     */
    api.reset = function() {
        queue = [];
    };

    /**
     * Add unread messages to the queue
     */
    api.add = function() {
        // queue = _.union(queue, _.where(messages, {IsRead: 0})); // Add only unread messages to the queue
        queue = messages; // Temporary test
    };

    /**
     * Preload messages present in the queue
     */
    api.preload = function() {
        // Get the first message in the queue
        var message  = _.first(queue);

        if(angular.isDefined(message)) {
            // Preload the first message
            cacheMessages.getMessage(message.ID);
            // Remove first in the queue
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
