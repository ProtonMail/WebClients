angular.module("proton.cache", [])

.service("cacheMessages", function(
    CONSTANTS,
    Message,
    $q
) {
    var api = {};
    var cache = {};

    /**
     * Return messages with request specified
     * request Object
     */
    api.query = function(request) {
        var deferred = $q.defer();

        // Do we have page and location defined only?
        if(Object.keys(request) === 2 & angular.isDefined(request.page) && angular.isDefined(request.location)) {
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
     */
    api.get = function(id) {
        return {};
    };

    /**
     * Store messages in cache location
     * request Object
     * location Integer
     */
    api.store = function(request, messages) {
        if(angular.isUndefined(cache[request.location])) {
            cache[request.location] = [];
        }

        cache[request.location] = messages;
    };

    /**
     * Delete message in each request
     * message Object
     */
    api.delete = function(message) {
        _.each(cache, function(request) {

        });
    };

    /**
     * Update message attached to the id specified
     * id string
     * message Object
     * location Integer
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

            // Remove first in queue
            queue = _.without(queue, message);
        }
    };

    /**
     * Loop around messages present in queue to preload the Body
     */
    api.loop = function() {
        $interval(function() {
            api.preload();
        }, interval);
    };

    api.loop(); // Start looping

    return api;
});
