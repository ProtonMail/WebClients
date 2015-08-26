angular.module("proton.cache", [])

.service("cacheMessages", function(
    CONSTANTS,
    Message,
    $q,
    $rootScope,
    $state,
    $stateParams
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

    var needRefresh = function(event) {
        var mailbox = $state.current.name.replace('secured.', '');
        var location = inCache(event.ID);

        if(location !== false) {
            // Check if the message is located in the current view
            return location === CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        } else {
            return true;
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

        return deferred.promise;
    };

    /**
     * Call the API to get message
     * @param {Integer} id
     */
    var getMessage = function(id) {

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
            if(angular.isDefined(cache[location])) {
                var page = request.Page || 0;
                var start = page * CONSTANTS.MESSAGES_PER_PAGE;
                var end = start + CONSTANTS.MESSAGES_PER_PAGE;
                var messages = cache[location].slice(start, end);

                deferred.resolve(messages);
            }
            // Else we call the API
            else {
                deferred.resolve(queryMessages(request));
            }
        }
        // Else we call the API
        else {
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
     * Store messages in cache location
     * @param {Object} request
     * @param {Integer} location Integer
     */
    api.store = function(request, messages) {
        var page = request.Page || 0;
        var index = page * CONSTANTS.MESSAGES_PER_PAGE;
        var howmany = messages.length;
        var location = request.Location;
        var context = cacheContext(request);

        if(angular.isUndefined(cache[location])) {
            cache[location] = [];
        }

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
        _.each(cache, function(location) {
            location = _.filter(location, function(message) {
                return message.ID !== event.ID;
             });
        });
    };

    /**
     * Add a new message in the cache
     */
    api.create = function(event) {
        var message = event.Message;
        var location = message.Location;
        var index;
        var cached = inCache(message.ID);

        if(angular.isUndefined(cache[location])) {
            cache[location] = [];
        }

        index = _.sortedIndex(cache[location], message, function(element) {
            return -element.Time;
        });

        if(cached === false) {
            cache[location].splice(index, 0, message);
        }
    };

    /**
     * Update message attached to the id specified
     * @param {Integer} id
     * @param {Object} message
     * @param {Integer} location
     */
    api.update = function(event) {
        var location = inCache(event.ID);

        if(location !== false) {
            var index = _.findIndex(cache[location], function(message) { return message.ID === event.ID; });

            cache[location][index] = _.extend(cache[location][index], event.Message);
        }
    };

    api.labels = function(event) {
        var location = inCache(event.ID);

        if(location !== false) {
            var index = _.findIndex(cache[location], function(message) { return message.ID === event.ID; });

            cache[location][index] = _.extend(cache[location][index], event.Message);
        }
    };

    /**
     * Manage the cache when a new event comes
     */
    api.events = function(events) {
        var refresh = false;

        _.each(events, function(event) {
            refresh = refresh || needRefresh(event);

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
                    api.labels(event);
                    break;
                default:
                    break;
            }
        });

        if(refresh) {
            api.refreshMessages();
        }
    };

    /**
     * Ask to the message list controller to refresh the messages
     */
    api.refreshMessages = function() {
        $rootScope.$broadcast('refreshMessagesCache');
    };

    return api;
})

.service("preloadMessageContent", function($interval, Message) {
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
     * Add unread messages to the queue
     */
    api.add = function() {
        queue = _.union(queue, _.where(messages, {IsRead: 0})); // Add only unread messages to the queue
    };

    /**
     * Preload messages present in the queue
     */
    api.preload = function() {
        // Get the first message in queue
        var message  = _.first(queue);

        if(angular.isDefined(message)) {
            // Preload the first message

            // Save it

            // Remove first in queue
            queue = _.without(queue, message);
        }
    };

    /**
     * Loop around messages present in queue to preload the Body
     */
    api.loop = function() {
        var looping = $interval(function() {
            api.preload();
        }, interval);
    };

    api.loop(); // Start looping

    return api;
});
