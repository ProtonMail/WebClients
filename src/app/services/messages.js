angular.module("proton.messages", ["proton.constants"])
    .service('messageCache', function(
        $q,
        $rootScope,
        Message,
        CONSTANTS,
        networkActivityTracker
     ) {
        var lists = [];
        var DELETE = 0;
		var CREATE = 1;
		var UPDATE = 2;
		var UPDATE_FLAG = 3;
        var inboxOneParams = {Location: 0, Page: 0};
        var inboxTwoParams = {Location: 0, Page: 1};
        var inboxInitParams = {Location: 0, Page: 0, PageSize: 120};
        var sentOneParams = {Location: 2, Page: 0};
        var cachedParams = [JSON.stringify(inboxOneParams), JSON.stringify(inboxTwoParams), JSON.stringify(sentOneParams)];
        var inboxOneMetaData, inboxTwoMetaData, sentOneMetaData;
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

        var messagesToPreload = _.bindAll({
            fetching: false,
            queue: [],
            empty: function() {
                this.queue = [];
            },
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
                    api.get(self.queue.shift()).then(function() {
                        if (self.queue.length === 0) {
                            self.fetching = false;
                        } else {
                            self.fetchNext();
                        }
                    });
                }, CONSTANTS.TIMEOUT_PRELOAD_MESSAGE);
            }
        });

        var cachedMetadata = _.bindAll({
            inbox: null,
            sent: null,
            // Function to pull data to keep inbox cache at 100 messages and sent to 50 messages.
            // Will eventually have a pool of extra messages and only call for the messages needed instead of whole page
            // when implemented in API
            sync: function(cacheLoc) {
                var deferred = $q.defer();

                if (cacheLoc === 'inbox') {
                    var lastMessage = _.last(cachedMetadata.inbox);
                    var numMessages = 120 - cachedMetadata.inbox.length;
                    var parameters = {Location: 0, Page: 0, PageSize: numMessages};

                    if(lastMessage) {
                        parameters.End = lastMessage.Time;
                    }

                    Message.query(parameters).$promise.then(function(result) {
                        angular.copy(cachedMetadata.inbox.concat(result.splice(1, numMessages - 1)), cachedMetadata.inbox);
                        addMessageList(cachedMetadata.inbox);
                        deferred.resolve();
                    }, function(error) {
                        deferred.reject();
                    });
                } else if (cacheLoc === 'sent') {
                    Message.query(sentOneParams).$promise.then(function(result) {
                        cachedMetadata.sent = result;
                        addMessageList(cachedMetadata.sent);
                        deferred.resolve();
                    }, function(error) {
                        deferred.reject();
                    });
                } else {
                    deferred.reject();
                }

                return deferred.promise;
            },
            delete: function(cacheLoc, message) {
                cachedMetadata[cacheLoc] = _.filter(cachedMetadata[cacheLoc], function(m) { return m.ID !== message.ID; });
            },
            update: function(cacheLoc, loc, message) {
                if (cacheLoc === loc) {
                    var index = _.findIndex(cachedMetadata[cacheLoc], function(m) { return m.ID === message.ID; });
                    cachedMetadata[cacheLoc][index] = _.extend(cachedMetadata[cacheLoc][index], message.Message);
                } else {
                    cachedMetadata[cacheLoc] = _.filter(cachedMetadata[cacheLoc], function(m) { return m.ID !== message.ID; });
                }
            },
            updateLabels: function(cacheLoc, loc, labelsChanged, message) {
                var index = _.findIndex(cachedMetadata[cacheLoc], function(m) { return m.ID === message.ID; });

                if (labelsChanged === 'added') {
                    cachedMetadata[cacheLoc][index].LabelIDs = _.uniq(cachedMetadata[cacheLoc][index].LabelIDs.concat(message.Message.LabelIDsAdded));
                } else if (labelsChanged === 'removed') {
                    cachedMetadata[cacheLoc][index].LabelIDs = _.difference(cachedMetadata[cacheLoc][index].LabelIDs, message.Message.LabelIDsRemoved);
                }

                message.Message = _.omit(message.Message, ['LabelIDsAdded', 'LabelIDsRemoved']);
                this.update(cacheLoc, loc, message);
            },
            create: function(loc, message) {
                var index = _.sortedIndex(cachedMetadata[loc], message, function(element) {
                    return -element.Time;
                });
                if (cachedMetadata[loc]) {
                    cachedMetadata[loc].splice(index, 0, message);
                }
            }
        });

        var cachedMessages = _.bindAll({
            cache: {},
            get: function(id) {
                var msg = false;

                if (angular.isDefined(this.cache[id])) {
                    msg = this.cache[id];
                }

                return msg;
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
                });
            },
            fusion: function(id, message) {
                this.cache[id] = message;
            }
        });

        var addMessageList = function(messageList) {
            var msg;

            lists.push(messageList);

            _.each(messageList, function(other, i) {
                // For every message in the newly downloaded message list
                if ((msg = cachedMessages.get(other.ID))) {
                    // If a completely fetched message exists in the cache
                    // replace the instance in the list with the complete cached instance
                    // updating variable fields
                    messageList.splice(i, 1, msg);
                    _.extend(msg, _.pick(other, fields));
                } else if(other.IsRead === 0) {
                    messagesToPreload.add(other.ID);
                }
            });
        };

        var refreshMessagesCache = function() {
            $rootScope.$broadcast('refreshMessagesCache');
        };

        var api = _.bindAll({
            started: false,
            watchScope: function(scope, listName) {
                var unsubscribe = scope.$watch(listName, function(newVal, oldVal) {
                    lists = _.without(lists, oldVal);
                    addMessageList(newVal);
                });

                scope.$on("$destroy", unsubscribe);
            },
            // Initialize cache
            start: function() {
                var deferred = $q.defer();

                inboxMetaData = Message.query(inboxInitParams).$promise;
                sentOneMetaData = Message.query(sentOneParams).$promise;

                networkActivityTracker.track($q.all({inbox: inboxMetaData, sentOne: sentOneMetaData}).then(
                    function(result) {
                        cachedMetadata.inbox = result.inbox;
                        addMessageList(cachedMetadata.inbox.slice(0, 2 * CONSTANTS.MESSAGES_PER_PAGE));
                        cachedMetadata.sent = result.sentOne;
                        this.started = true;

                        deferred.resolve();
                    }.bind(this),
                    function(error) {
                        error.message = 'Error during the messages request for inbox and sent';
                        deferred.reject(error);
                    }
                ));

                return deferred.promise;
            },
            reset: function() {
                this.started = false;
                cachedMessages.cache = {};
                cachedMetadata.inbox = null;
                cachedMetadata.sent = null;
                this.start();
            },
            empty: function() {
                this.started = false;
                cachedMessages.cache = {};
                cachedMetadata.inbox = null;
                cachedMetadata.sent = null;
            },
            // Function for dealing with message cache updates
            set: function(messages, preventRefresh, params) {
                var promises = [];

                _.each(messages, function(message) {
                    var inInboxCache = (_.where(cachedMetadata.inbox, {ID: message.ID}).length > 0);
                    var inSentCache = (_.where(cachedMetadata.sent, {ID: message.ID}).length > 0);
                    var inInbox = (message.Message && message.Message.Location === CONSTANTS.MAILBOX_IDENTIFIERS.inbox);
                    var inSent = (message.Message && message.Message.Location === CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                    var hasLocation = (!inInbox && !inSent && message.Message && message.Message.Location) ? true : false;
                    var labelsChanged = (message.Message && message.Message.LabelIDsAdded) ? 'added' : (message.Message && message.Message.LabelIDsRemoved) ? 'removed': false;
                    // False if message not in cache, otherwise value is which cache it is in
                    var cacheLoc = (inInboxCache) ? 'inbox' : (inSentCache) ? 'sent' : false;
                    // False if message is not in inbox or sent, otherwise value is which one it is in
                    var loc = (inInbox) ? 'inbox' : (inSent) ? 'sent' : (!hasLocation && cacheLoc) ? cacheLoc : false;
                    var messagePromise;
                    // DELETE - message in cache
                    if (message.Action === DELETE && cacheLoc) {
                        cachedMetadata.delete(cacheLoc, message);
                    }

                    // CREATE - location is either inbox or sent
                    else if(message.Action === CREATE && loc && !cacheLoc) {
                        cachedMetadata.create(loc, message.Message);
                    }

                    // UPDATE_FLAG - message in cache
                    else if (message.Action === UPDATE_FLAG && cacheLoc) {
                        if (labelsChanged) {
                            cachedMetadata.updateLabels(cacheLoc, loc, labelsChanged, message);
                        } else {
                            cachedMetadata.update(cacheLoc, loc, message);
                        }
                    }

                    // UPDATE_FLAG - message not in cache, but in inbox or sent. Check if time after last message
                    else if (message.Action === UPDATE_FLAG && loc) {
                        if (cachedMetadata[loc].length < CONSTANTS.MESSAGES_PER_PAGE || message.Message.Time > cachedMetadata[loc][cachedMetadata[loc].length -1].Time) {
                            // if message contains subject you moved on this device so no need to query for message content
                            if (message.Message.Subject) {
                                if (!cacheLoc) {
                                    cachedMetadata.create(loc, message.Message);
                                } else {
                                    cachedMetadata.update(cacheLoc, loc, message.Message);
                                }
                            } else {
                                messagePromise = Message.get({id: message.ID}).$promise;
                                promises.push(messagePromise);
                                messagePromise.then(function(m) {
                                    cachedMetadata.create(loc, m);
                                });
                            }
                        }
                    }

                    // UPDATE - message not in cache, but in inbox or sent. Check if time after last message. This case used more when we cache current
                    // currently same as previous case
                    else if (message.Action === UPDATE && loc) {
                        if (cachedMetadata[loc].length < CONSTANTS.MESSAGES_PER_PAGE || message.Message.Time > cachedMetadata[loc][cachedMetadata[loc].length -1].Time) {
                            messagePromise = Message.get({id: message.ID}).$promise;
                            promises.push(messagePromise);
                            messagePromise.then(function(m) {
                                if (!cacheLoc) {
                                    cachedMetadata.create(loc, m);
                                } else {
                                    cachedMetadata.update(cacheLoc, loc, m);
                                }
                            });
                        }
                    }
                });
                $q.all(promises).then(function() {
                    // Does not refresh if you move messages on your device on a non-cached page
                    // This prevents the messages from reapearing for a few seconds
                    if (!preventRefresh || cachedParams.indexOf(JSON.stringify(params)) !== -1) {
                        refreshMessagesCache();
                    }
                });
            },
            sync: function() {
                var promises = [];

                if (cachedMetadata.inbox.length < 100) {
                    promises.push(cachedMetadata.sync('inbox'));
                }

                if (cachedMetadata.sent.length < 50) {
                    promises.push(cachedMetadata.sync('sent'));
                }

                $q.all(promises).then(function() {
                    refreshMessagesCache();
                });
            },
            manageExpire: function() {
                var now = Date.now()/1000;
                var removed = 0;

                cachedMetadata.inbox = _.filter(cachedMetadata.inbox, function(message) {
                    expTime = message.ExpirationTime;
                    var response = (expTime !== 0 && expTime < now) ? false : true;
                    if (!response) { removed++; }
                    return response;
                });

                cachedMetadata.sent = _.filter(cachedMetadata.sent, function(message) {
                    expTime = message.ExpirationTime;
                    var response = (expTime !== 0 && expTime < now) ? false : true;
                    if (!response) { removed++; }
                    return response;
                });

                if (removed > 0) {
                    refreshMessagesCache();
                }
            },
            // Function for returning cached data if available or returning promise if not
            query: function(params) {
                var deferred = $q.defer();
                var process = function() {
                    if (_.isEqual(params, inboxOneParams)) {
                        deferred.resolve(cachedMetadata.inbox.slice(0, CONSTANTS.MESSAGES_PER_PAGE));
                        return deferred.promise;
                    } else if (_.isEqual(params, inboxTwoParams)) {
                        deferred.resolve(cachedMetadata.inbox.slice(CONSTANTS.MESSAGES_PER_PAGE, 2 * CONSTANTS.MESSAGES_PER_PAGE));
                        return deferred.promise;
                    } else if (_.isEqual(params, sentOneParams)) {
                        deferred.resolve(cachedMetadata.sent);
                        return deferred.promise;
                    } else {
                        return networkActivityTracker.track(Message.query(params).$promise);
                    }
                };

                if (this.started === false) {
                    return this.start().then(function() {
                        return process();
                    });
                } else {
                    return process();
                }
            },
            get: function(id) {
                var deferred = $q.defer();
                var msg = cachedMessages.get(id);

                if (!msg) {
                    msg = Message.get({ id: id });
                    cachedMessages.put(id, msg);
                    deferred.resolve(msg.$promise);
                } else {
                    deferred.resolve(msg);
                }

                return deferred.promise;
            },
            put: function(id, msg) {
                cachedMessages.fusion(id, msg);
            }
        });

        return api;
    });
