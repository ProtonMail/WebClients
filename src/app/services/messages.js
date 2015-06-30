angular.module("proton.messages", [])
    .service('messageCache', function($q, Message, CONSTANTS, $rootScope, tools) {
        var lists = [];
        var DELETE = 0;
		var CREATE = 1;
		var UPDATE = 2;
		var UPDATE_FLAG = 3;

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
        var inboxOneMetaData, inboxTwoMetaData, sentOneMetaData;
        var started = false;

        var cachedMetadata = _.bindAll({
            inbox: null,
            sent: null,
            // Function to pull data to keep inbox cache at 100 messages and sent to 50 messages. 
            // Will eventually have a pool of extra messages and only call for the messges needed instead of whole page
            // when implemented in API
            sync: function(cacheLoc) {
                if (cacheLoc === 'inbox') {
                    Message.query(inboxTwoParams).$promise.then(function(result) {
                        cachedMetadata.inbox = cachedMetadata.inbox.slice(0, CONSTANTS.MESSAGES_PER_PAGE).concat(result);
                        addMessageList(cachedMetadata.inbox);
                        $rootScope.$broadcast('refreshMessagesCache');
                    });
                } else if (cacheLoc === 'sent') {
                    Message.query(sentOneParams).$promise.then(function(result) {
                        cachedMetadata.sent = result;
                        addMessageList(cachedMetadata.sent);
                        $rootScope.$broadcast('refreshMessagesCache');
                    });
                }
            },
            delete: function(cacheLoc, message) {
                cachedMetadata[cacheLoc] = _.filter(cachedMetadata[cacheLoc], function(m) { return m.ID !== message.ID; });
                cachedMetadata.sync(cacheLoc);
            },
            update: function(cacheLoc, loc, message){
                if (cacheLoc === loc) {
                    var index = _.findIndex(cachedMetadata[cacheLoc], function(m) { return m.ID === message.ID; });
                    cachedMetadata[cacheLoc][index] = _.extend(cachedMetadata[cacheLoc][index], message.Message);
                    addMessageList(cachedMetadata[loc]);
                } else {
                    cachedMetadata[cacheLoc] = _.filter(cachedMetadata[cacheLoc], function(m) { return m.ID !== message.ID; });
                    $rootScope.$broadcast('refreshMessagesCache');
                    cachedMetadata.sync(cacheLoc);
                }
            },
            updateLabels: function(cacheLoc, message) {
                var index = _.findIndex(cachedMetadata[cacheLoc], function(m) { return m.ID === message.ID; });
                cachedMetadata[cacheLoc][index].LabelIDs = message.LabelIDs;
            },
            create: function(loc, message) {
                index = _.sortedIndex(cachedMetadata[loc], message, function(a) {return -a.Time;});
                cachedMetadata[loc].pop();
                cachedMetadata[loc].splice(index, 0, message);
                $rootScope.$broadcast('refreshMessagesCache');
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
            // Initialize cache
            start: function() {
                started = true;
                inboxOneMetaData = Message.query(inboxOneParams).$promise;
                inboxTwoMetaData = Message.query(inboxTwoParams).$promise;
                sentOneMetaData = Message.query(sentOneParams).$promise;

                $q.all({inboxOne: inboxOneMetaData, inboxTwo: inboxTwoMetaData, sentOne: sentOneMetaData}).then(function(result) {
                        addMessageList(result.inboxOne);
                        addMessageList(result.inboxTwo);
                        cachedMetadata.inbox = result.inboxOne.concat(result.inboxTwo);
                        cachedMetadata.sent = result.sentOne;

                        deferred.resolve();
                });
            },
            reset: function() {
                started = false;
                cachedMessages.cache = {};
                cachedMetadata.inbox = null;
                cachedMetadata.sent = null;
                this.start();
            },
            // Function for dealing with message cache updates
            set: function(messages) {
                var currentLocation = tools.getCurrentLocation();
                _.each(messages, function(message) {
                    var inInboxCache = (_.where(cachedMetadata.inbox, {ID: message.ID}).length > 0);
                    var inSentCache = (_.where(cachedMetadata.sent, {ID: message.ID}).length > 0);
                    var inInbox = (message.Message.Location === CONSTANTS.MAILBOX_IDENTIFIERS.inbox);
                    var inSent = (message.Message.Location === CONSTANTS.MAILBOX_IDENTIFIERS.sent);

                    // False if message not in cache, otherwise value is which cache it is in
                    var cacheLoc = (inInboxCache) ? 'inbox' : (inSentCache) ? 'sent' : false;

                    // False if message is not in inbox or sent, otherwise value is which one it is in
                    var loc = (inInbox) ? 'inbox' : (inSent) ? 'sent' : false;

                    // DELETE - message in cache
                    if (message.Action === DELETE && cacheLoc) {
                        cachedMetadata.delete(cacheLoc);
                    }

                    // CREATE - location is either inbox or sent
                    else if(message.Action === CREATE && loc && !cacheLoc) {
                        cachedMetadata.create(loc, message.Message);
                    }

                    // UPDATE_FLAG - message in cache
                    else if (message.Action === UPDATE_FLAG && cacheLoc) {
                        cachedMetadata.update(cacheLoc, loc, message);
                    }

                    // UPDATE_FLAG - message not in cache, but in inbox or sent. Check if time after last message
                    else if (message.Action === UPDATE_FLAG && loc) {
                        if (message.Message.Time > cachedMetadata[loc][cachedMetadata[loc].length -1].Time) {
                            Message.get({id: message.ID}).$promise.then(function(m) {
                                cachedMetadata.create(loc, m);
                            });
                        }
                    }

                    // UPDATE - message not in cache, but in inbox or sent. Check if time after last message. This case used more when we cache current
                    // currently same as previous case
                    else if (message.Action === UPDATE && loc) {
                        if (message.Message.Time > cachedMetadata[loc][cachedMetadata[loc].length -1].Time) {
                            Message.get({id: message.ID}).$promise.then(function(m) {
                                cachedMetadata.create(loc, m);
                            });
                        }
                    }
                });
            },
            // Function for dealing with Messge Label cache updates
            setLabels: function(messages) {
                _.each(messages, function(message) {
                    var inInboxCache = (_.where(cachedMetadata.inbox, {ID: message.ID}).length > 0);
                    var inSentCache = (_.where(cachedMetadata.sent, {ID: message.ID}).length > 0);
                    var cacheLoc = (inInboxCache) ? 'inbox' : (inSentCache) ? 'sent' : false;

                    if (cacheLoc) {
                        cachedMetadata.updateLabels(cacheLoc, message);
                    }
                });
            },
            // Function for returning cached data if available or returning promise if not
            query: function(params) {
                var deferred = $q.defer();

                if (!started) {
                    this.start();
                }

                if (_.isEqual(params, inboxOneParams)) {
                    if(cachedMetadata.inbox === null) {
                        return inboxOneMetaData;
                    } else {
                        deferred.resolve(cachedMetadata.inbox.slice(0, CONSTANTS.MESSAGES_PER_PAGE));
                        return deferred.promise;
                    }
                } else if (_.isEqual(params, inboxTwoParams)) {
                    if(cachedMetadata.inbox === null) {
                        return inboxTwoMetaData;
                    } else {
                        deferred.resolve(cachedMetadata.inbox.slice(CONSTANTS.MESSAGES_PER_PAGE, 2 * CONSTANTS.MESSAGES_PER_PAGE));
                        return deferred.promise;
                    }
                } else if (_.isEqual(params, sentOneParams)) {
                    if(cachedMetadata.sent === null) {
                        return sentOneMetaData;
                    } else {
                        deferred.resolve(cachedMetadata.sent);
                        return deferred.promise;
                    }
                } else {
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
