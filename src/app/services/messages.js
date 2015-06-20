angular.module("proton.messages", [])
    .service('messageCache', function($q, Message, CONSTANTS) {
        var lists = [];

        var messagesToPreload = _.bindAll({
            fetching: false,
            queue: [],
            add: function(id) {
                if (!_.contains(this, id)) {
                    this.queue.push(id);
                    this.fetch();
                }
            },
            fetch: function() {
                if (!this.fetching && this.queue.length > 0) {
                    this.fetching = true;
                    this.fetchNext();
                }
            },
            fetchNext: function() {
                var self = this;
                api.get(this.queue.shift()).$promise.then(function() {
                    if (self.queue.length === 0) {
                        self.fetching = false;
                    } else {
                        self.fetchNext();
                    }
                });
            }
        });

        var cachedMessages = _.bindAll({
            cache: {},
            get: function(id) {
                var msg;

                if ((msg = this.cache[id])) {
                    return msg;
                }

                var data = window.sessionStorage["proton:message:" + id];

                if (data) {
                    var q = $q.defer();

                    data = new Message(JSON.parse(data));
                    data.$promise = q.promise;
                    q.resolve(data);
                    this.cache[id] = data;
                }

                return data;
            },
            put: function(id, message) {
                var self = this;
                message.$promise.then(function() {
                    // When the message is downloaded
                    _.each(lists, function(list) {
                        // Loop through each loaded message lists
                        _.find(list, function(msg, i) {
                            // and for each, loop through each of its messages
                            if (msg.ID === id) {
                                // replacing matching message excerpts with
                                // this new detailed one.
                                message.Selected = msg.Selected;
                                list.splice(i, 1, message);

                                // Stopping iteration as soon as there's a match
                                // (returning true in _.find stops iteration)
                                return true;
                            }
                        });
                    });

                    self.cache[id] = message;

                    // Cache a stringified version of the message in session storage
                    window.sessionStorage["proton:message:" + id] = JSON.stringify(message);
                });
            },
            fusion: function(id, message) {
                var data = window.sessionStorage["proton:message:" + id];

                if(data) {
                    var msg = _.extend(JSON.parse(data), _.pick(message, 'IsRead', 'Starred',  'Location', 'LabelIDs'));

                    this.cache[id] = msg;
                    window.sessionStorage["proton:message:" + id] = JSON.stringify(msg);
                }
            }
        });

        var addMessageList = function(messageList) {
            var msg;

            lists.push(messageList);
            _.find(messageList, function(other, i) {
                // For every message in the newly downloaded message list

                if ((msg = cachedMessages.get(other.ID))) {
                    // If a completely fetched message exists in the cache
                    // replace the instance in the list with the complete cached instance
                    // updating variable fields (IsRead, Tag, Location, Labels)
                    messageList.splice(i, 1, msg);
                    _.extend(msg, _.pick(other, 'IsRead', 'Starred',  'Location', 'LabelIDs'));
                } else {
                    messagesToPreload.add(other.ID);
                }
            });
        };

        var api = _.bindAll({
            watchScope: function(scope, listName) {
                var messageList = scope[listName];

                if (_.isArray(messageList)) {
                    addMessageList(messageList);
                }

                var unsubscribe = scope.$watch(listName, function(newVal, oldVal) {
                    lists = _.without(lists, oldVal);
                    addMessageList(newVal);
                });

                scope.$on("$destroy", unsubscribe);
            },
            get: function(id) {
                var msg = cachedMessages.get(id);

                if (!msg) {
                    msg = Message.get({
                        id: id
                    });
                    cachedMessages.put(id, msg);
                }

                return msg;
            },
            put: function(id, msg) {
                cachedMessages.fusion(id, msg);
            }
        });

        return api;
    });
