angular.module("proton.messages", [])
    .service('messageCache', function($q, Message, CONSTANTS, $rootScope, tools) {
        var lists = [];
        var DELETE = 0;
		var CREATE = 1;
		var UPDATE = 2;

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

                setTimeout(function() {
                    api.get(self.queue.shift()).$promise.then(function() {
                        if (self.queue.length === 0) {
                            self.fetching = false;
                        } else {
                            self.fetchNext();
                        }
                    });
                }, CONSTANTS.TIMEOUT_PRELOAD_MESSAGE);
            }
        });

        var inboxOneParams = {Location: 0, Page: 0};
        var inboxTwoParams = {Location: 0, Page: 1};
        var sentOneParams = {Location: 2, Page: 0};

        var inboxOneMetaData = Message.query(inboxOneParams).$promise;
        var inboxTwoMetaData = Message.query(inboxTwoParams).$promise;
        var sentOneMetaData = Message.query(sentOneParams).$promise;

        $q.all({inboxOne: inboxOneMetaData, inboxTwo: inboxTwoMetaData, sentOne: sentOneMetaData}).then(function(result) {
                addMessageList(result.inboxOne);
                addMessageList(result.inboxTwo);

                cachedMessages.inbox = result.inboxOne.concat(result.inboxTwo);
                cachedMessages.sent = result.sentOne;
        });

        var cachedMessages = _.bindAll({
            cache: {},
            inbox: null,
            sent: null,
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
                    var msg = _.extend(JSON.parse(data), _.pick(message, fields));

                    this.cache[id] = message;
                    window.sessionStorage["proton:message:" + id] = JSON.stringify(msg);
                }
            }
        });

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
                    _.extend(msg, _.pick(other, fields));
                } else {
                    if(other.IsRead === 0) {
                        messagesToPreload.add(other.ID);
                    }
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
            set: function(messages) {
                var currentLocation = tools.getCurrentLocation();

                _.each(messages, function(message) {
                    var inInbox = message.Location === CONSTANTS.MAILBOX_IDENTIFIERS.inbox;
                    var inSent = message.Location === CONSTANTS.MAILBOX_IDENTIFIERS.sent;
                    var location = function() {
                        if(_.where(cachedMessages.inbox, {ID: message.ID}).length > 0) {
                            return 'inbox';
                        } else if(_.where(cachedMessages.sent, {ID: message.ID}).length > 0) {
                            return 'sent';
                        } else {
                            return false;
                        }
                    };

                    if(location) {
                        if(message.Action === DELETE) {
                            messageCache[location] = _.filter(messageCache[location], function(m) { return m.ID !== message.ID; });
                        } else if(message.Action === CREATE) {
                            messageCache[location].push(message.Message);
                            messageCache[inbox].pop();
                        } else if (message.Action === UPDATE) {
                            var index = _.findIndex(messageCache[location], function(m) { return m.ID === message.Message.ID; });
                            messageCache[location][index] = _.extend(messageCache[location][index], message);
                        }
                    }
                });
            },
            query: function(params) {
                var deferred = $q.defer();

                if (_.isEqual(params, inboxOneParams)) {
                    if(cachedMessages.inbox === null) {
                        return inboxOneMetaData;
                    } else {
                        deferred.resolve(cachedMessages.inbox.slice(0, CONSTANTS.MESSAGES_PER_PAGE - 1));
                        return deferred.promise;
                    }
                }
                else if (_.isEqual(params, inboxTwoParams)) {
                    if(cachedMessages.inbox === null) {
                        return inboxTwoMetaData;
                    } else {
                        deferred.resolve(cachedMessages.inbox.slice(-CONSTANTS.MESSAGES_PER_PAGE));
                        return deferred.promise;
                    }
                }
                else if (_.isEqual(params, sentOneParams)) {
                    if(cachedMessages.sent === null) {
                        return sentOneMetaData;
                    } else {
                        deferred.resolve(cachedMessages.sent);
                        return deferred.promise;
                    }
                }
                else {
                    return Message.query(params).$promise;
                }
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
