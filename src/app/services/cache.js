angular.module("proton.cache", [])

.service("cacheMessages", function(
    CONSTANTS,
    Message,
    $q
) {
    var api = {};
    var cache = {};

    /**
     * Check if the request is in a cache context
     * @param {Object} request
     */
    var cacheContext = function(request) {
        var result = Object.keys(request).length === 2 && angular.isDefined(request.page) && angular.isDefined(request.location);

        return result;
    };

    /**
     * Return messages with request specified
     * @param {Object} request
     */
    api.query = function(request) {
        console.log('cacheMessages.query');
        var deferred = $q.defer();

        // In cache context?
        if(cacheContext(request)) {
            // Messages present in cache?
            if(angular.isDefined(cache[request.location])) {
                var page = request.page || 0;
                var start = page * CONSTANTS.MESSAGES_PER_PAGE;
                var end = start + CONSTANTS.MESSAGES_PER_PAGE;
                var messages = cache[request.location].slice(start, end);

                deferred.resolve(messages);
            }
            // Else we call the API
            else {
                deferred.resolve(Message.query(request).$promise);
            }
        }
        // Else we call the API
        else {
            deferred.resolve(Message.query(request).$promise);
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
        var page = request.page || 0;
        var index = page * CONSTANTS.MESSAGES_PER_PAGE;
        var howmany = messages.length;
        var location = request.location;

        if(angular.isUndefined(cache[location])) {
            cache[location] = [];
        }

        // Store messages at the correct placement
        cache[location].splice(index, howmany, messages);
    };

    /**
     * Save message in cache
     * @param {Object} message
     */
    api.save = function(message) {
        var location = message.Location;

        if(angular.isUndefined(cache[location])) {
            cache[location] = [];
        }

        // Save the message at the correct placement
        // cache[location] =
    };

    /**
     * Delete message in each location
     * @param {Object} message
     */
    api.delete = function(message) {
        _.each(cache, function(location) {
            cache[location] = _.without(cache[location], message);
        });
    };

    /**
     * Update message attached to the id specified
     * @param {Integer} id
     * @param {Object} message
     * @param {Integer} location
     */
    api.update = function(id, message, location) {

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
