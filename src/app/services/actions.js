angular.module('proton.actions', [])

.factory('action', function(
    $q,
    $rootScope,
    tools,
    cache,
    Conversation,
    Message,
    networkActivityTracker,
    CONSTANTS
) {
    return {
        // Conversation actions
        /**
         * Move conversation
         * @param {Array} ids
         * @param {String} mailbox
         */
        moveConversation: function(ids, mailbox) {
            var context = tools.cacheContext();
            var events = [];
            var current = tools.currentLocation();
            var promise;
            var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
            var inInbox = labelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox) !== -1;
            var labelIDsRemoved = _.reject([current], function(labelID) {
                // Remove starred and labels
                return labelID === CONSTANTS.MAILBOX_IDENTIFIERS.starred || labelID.length > 2;
            });

            // Generate cache events
            _.each(ids, function(id) {
                var element = {
                    ID: id,
                    Selected: false,
                    LabelIDsRemoved: labelIDsRemoved, // Remove current location
                    LabelIDsAdded: labelIDsAdded // Add new location
                };
                var messages = cache.queryMessagesCached(element.ID);

                if(messages.length > 0) {
                    _.each(messages, function(message) {
                        var copyLabelIDsAdded = labelIDsAdded;
                        var copyLabelIDsRemoved = labelIDsRemoved;

                        if(inInbox === true) {
                            var index;

                            if(message.Type === 1) { // This message is a draft, if you move it to trash and back to inbox, it will go to draft instead
                                index = copyLabelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox);

                                copyLabelIDsAdded.splice(index, 1);
                                copyLabelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.drafts);
                            } else if(message.Type === 2) { // This message is sent, if you move it to trash and back, it will go back to sent
                                index = copyLabelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox);

                                copyLabelIDsAdded.splice(index, 1);
                                copyLabelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                            } else if(message.Type === 3) { // Type 3 is inbox and sent, (a message sent to yourself), if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
                                copyLabelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                            }
                        }

                        events.push({Action: 3, ID: message.ID, Message: {
                            ID: message.ID,
                            LabelIDsRemoved: copyLabelIDsRemoved, // Remove current location
                            LabelIDsAdded: copyLabelIDsAdded // Add new location
                        }});
                    });
                }

                events.push({Action: 3, ID: element.ID, Conversation: element});
            });

            // Send request
            promise = Conversation[mailbox](ids);

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Apply labels on a list of conversations
         * @param {Array} ids
         * @param {Array} labels
         * @param {Boolean} alsoArchive
         */
        labelConversation: function(ids, labels, alsoArchive) {
            var context = tools.cacheContext();
            var REMOVE = 0;
            var ADD = 1;
            var promises = [];
            var promise;
            var events = [];
            var current = tools.currentLocation();
            var process = function() {
                cache.events(events);

                if(alsoArchive === true) {
                    Conversation.archive(ids); // Send request to archive conversations
                }
            };

            _.each(ids, function(conversationID) {
                var conversation = cache.getConversationCached(conversationID);
                var messages = cache.queryMessagesCached(conversationID);
                var toApply = _.map(_.filter(labels, function(label) {
                    return label.Selected === true && angular.isArray(conversation.LabelIDs) && conversation.LabelIDs.indexOf(label.ID) === -1;
                }), function(label) {
                    return label.ID;
                }) || [];
                var toRemove = _.map(_.filter(labels, function(label) {
                    return label.Selected === false && angular.isArray(conversation.LabelIDs) && conversation.LabelIDs.indexOf(label.ID) !== -1;
                }), function(label) {
                    return label.ID;
                }) || [];

                if(alsoArchive === true) {
                    toApply.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive);
                    toRemove.push(current);
                }

                var element = {
                    ID: conversationID,
                    Selected: false,
                    LabelIDsAdded: toApply,
                    LabelIDsRemoved: toRemove
                };

                _.each(messages, function(message) {
                    events.push({Action: 3, ID: message.ID, Message: {
                        ID: message.ID,
                        LabelIDsAdded: toApply,
                        LabelIDsRemoved: toRemove
                    }});
                });

                events.push({Action: 3, ID: conversationID, Conversation: element});

                _.each(toApply, function(labelID) {
                    promises.push(Conversation.labels(labelID, ADD, ids));
                });

                _.each(toRemove, function(labelID) {
                    promises.push(Conversation.labels(labelID, REMOVE, ids));
                });
            });

            promise = $q.all(promises);

            if(context === true) {
                process();
            } else {
                promise.then(function(results) {
                    process();
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Star conversation
         * @param {String} id - conversation id
         */
        starConversation: function(id) {
            var context = tools.cacheContext();
            var events = [];
            var promise;
            var element = {
                ID: id,
                LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.starred]
            };
            var messages = cache.queryMessagesCached(element.ID);

            // Generate message changes with event
            if(messages.length > 0) {
                _.each(messages, function(message) {
                    events.push({ID: message.ID, Action: 3, Message: {
                        ID: message.ID,
                        LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.starred]
                    }});
                });
            }

            // Generate conversation changes with event
            events.push({ID: element.ID, Action: 3, Conversation: element});

            // Send conversation request
            promise = Conversation.star([element.ID]);

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send to cache manager
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Unstar conversation
         * @param {String} id - conversation id
         */
        unstarConversation: function(id) {
            var context = tools.cacheContext();
            var events = [];
            var promise;
            var element = {
                ID: id,
                LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.starred]
            };
            var messages = cache.queryMessagesCached(element.ID);

            // Generate message changes with event
            if(messages.length > 0) {
                _.each(messages, function(message) {
                    events.push({ID: message.ID, Action: 3, Message: {
                        ID: message.ID,
                        LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.starred]
                    }});
                });
            }

            // Generate conversation changes with event
            events.push({ID: element.ID, Action: 3, Conversation: element});

            // Send request
            promise = Conversation.unstar([element.ID]);

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send to cache manager
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Mark as read a list of conversation
         * @param {Array} ids
         */
        readConversation: function(ids) {
            var context = tools.cacheContext();
            var events = [];
            var promise;

            // Generate cache events
            _.each(ids, function(id) {
                var element = {
                    ID: id
                };
                var messages = cache.queryMessagesCached(element.ID);

                element.NumUnread = 0;

                if(messages.length > 0) {
                    _.each(messages, function(message) {
                        events.push({Action: 3, ID: message.ID, Message: {
                            ID: message.ID,
                            IsRead: 1
                        }});
                    });
                }

                events.push({Action: 3, ID: element.ID, Conversation: element});
            });

            // Send request
            promise = Conversation.read(ids);

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Mark as unread a list of conversation
         * @param {Array} ids
         */
        unreadConversation: function(ids) {
            var context = tools.cacheContext();
            var events = [];
            var promise;

            // Generate cache events
            _.each(ids, function(id) {
                var elementCached;
                var element = {
                    ID: id
                };
                var messages = cache.queryMessagesCached(element.ID);

                elementCached = cache.getConversationCached(id);
                element.NumUnread = elementCached.NumMessages;

                if(messages.length > 0) {
                    _.each(messages, function(message) {
                        events.push({Action: 3, ID: message.ID, Message: {
                            ID: message.ID,
                            IsRead: 0
                        }});
                    });
                }

                events.push({Action: 3, ID: element.ID, Conversation: element});
            });

            // Send request
            promise = Conversation.unread(ids);

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Delete a list of conversations
         * @param {ids}
         */
        deleteConversation: function(ids) {
            var context = tools.cacheContext();
            var events = [];
            var promise;

            // Generate cache event
            _.each(ids, function(conversationID) {
                var conversation = cache.getConversationCached(conversationID); // Get conversation cached
                var messages = cache.queryMessagesCached(conversationID); // Get messages cached for this conversation
                var counter = 0; // Initialize counter, count the number of message deleted

                $rootScope.$broadcast('deleteConversation', conversationID); // Close composer

                _.each(messages, function(message) {
                    if(message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash)) {
                        counter++;
                        events.push({Action: 0, ID: message.ID});
                    }
                });

                events.push({Action: 0, ID: conversationID});
            });

            // Send the request
            promise = Conversation.delete(ids);

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache event
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        // Message actions
        moveMessage: function(ids, mailbox) {
            var context = tools.cacheContext();
            var conversationIDs = [];
            var events = [];
            var promise;

            // Generate cache events
            _.each(ids, function(id) {
                var message = cache.getMessageCached(id);
                var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
                var inInbox = mailbox === 'inbox';
                var labelIDsRemoved = _.reject(message.LabelIDs, function(labelID) {
                    // Remove starred and labels
                    return labelID === CONSTANTS.MAILBOX_IDENTIFIERS.starred || labelID.length > 2;
                });

                conversationIDs.push(message.ConversationID);

                if(inInbox === true) {
                    var index;

                    if(message.Type === 1) { // This message is a draft, if you move it to trash and back to inbox, it will go to draft instead
                        index = labelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox);

                        labelIDsAdded.splice(index, 1);
                        labelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.drafts);
                    } else if(message.Type === 2) { // This message is sent, if you move it to trash and back, it will go back to sent
                        index = labelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox);

                        labelIDsAdded.splice(index, 1);
                        labelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                    } else if(message.Type === 3) { // Type 3 is inbox and sent, (a message sent to yourself), if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
                        labelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                    }
                }

                events.push({Action: 3, ID: id, Message: {
                    ID: id,
                    Selected: false,
                    LabelIDsAddeds: labelIDsAdded,
                    LabelIDsRemoved: labelIDsRemoved
                }});
            });

            _.each(conversationIDs, function(conversationID) {
                var conversation = cache.getConversationCached(conversationID);
                var messages = cache.queryMessagesCached(conversationID);
                var labelIDs = [];

                _.each(messages, function(message) {
                    labelIDs = labelIDs.concat(message.LabelIDs);
                });

                labelIDs.splice(_.findIndex(labelIDs, function(labelID) { return ['0', '1', '2', '3', '4', '6'].indexOf(labelID) !== -1; }), 1); // Remove current location
                labelIDs.push(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]); // Add new location

                events.push({Action: 3, ID: conversationID, Conversation: {
                    ID: conversationID,
                    LabelIDs: _.uniq(labelIDs)
                }});
            });

            // Send request
            promise = Message[mailbox]({IDs: ids}).$promise;

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Apply labels on a list of messages
         * @param {Array} messages
         * @param {Array} labels
         * @param {Boolean} alsoArchive
         */
        labelMessage: function(messages, labels, alsoArchive) {
            var context = tools.cacheContext();
            var REMOVE = 0;
            var ADD = 1;
            var promises = [];
            var promise;
            var events = [];
            var current = tools.currentLocation();
            var ids =  _.map(messages, function(message) { return message.ID; });
            var process = function() {
                cache.events(events).then(function() {
                    var events2 = [];

                    _.each(messages, function(message) {
                        var conversationID = message.ConversationID;
                        var conversation = cache.getConversationCached(conversationID);

                        if(angular.isDefined(conversation)) { // In the draft folder, conversation can be undefined
                            var messages = cache.queryMessagesCached(conversationID);
                            var labelIDs = [];

                            _.each(messages, function(message) {
                                labelIDs = labelIDs.concat(message.LabelIDs);
                            });

                            conversation.LabelIDs = _.uniq(labelIDs);
                            events2.push({Action: 3, ID: conversation.ID, Conversation: conversation});
                        }
                    });

                    cache.events(events2);

                    if(alsoArchive === true) {
                        Message.archive({IDs: ids}); // Send request to archive conversations
                    }
                });
            };

            _.each(messages, function(message) {

                var toApply = _.map(_.filter(labels, function(label) {
                    return label.Selected === true && angular.isArray(message.LabelIDs) && message.LabelIDs.indexOf(label.ID) === -1;
                }), function(label) {
                    return label.ID;
                }) || [];
                var toRemove = _.map(_.filter(labels, function(label) {
                    return label.Selected === false && angular.isArray(message.LabelIDs) && message.LabelIDs.indexOf(label.ID) !== -1;
                }), function(label) {
                    return label.ID;
                }) || [];

                if(alsoArchive === true) {
                    toApply.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive);
                    toRemove.push(current);
                }

                var element = {
                    ID: message.ID,
                    ConversationID: message.ConversationID,
                    Selected: false,
                    LabelIDsAdded: toApply,
                    LabelIDsRemoved: toRemove
                };

                events.push({Action: 3, ID: element.ID, Message: element});

                _.each(toApply, function(labelID) {
                    promises.push(new Message().updateLabels(labelID, ADD, ids));
                });

                _.each(toRemove, function(labelID) {
                    promises.push(new Message().updateLabels(labelID, REMOVE, ids));
                });
            });

            promise = $q.all(promises);

            if(context === true) {
                process();
            } else {
                promise.then(function(results) {
                    process();
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Star a message
         * @param {String} id
         */
        starMessage: function(id) {
            var context = tools.cacheContext();
            var ids = [id];
            var events = [];
            var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
            var message = cache.getMessageCached(id);
            var promise;

            // Messages
            events.push({Action: 3, ID: message.ID, Message: {
                ID: message.ID,
                LabelIDsAdded: labelIDsAdded
            }});

            // Conversation
            events.push({Action: 3, ID: message.ConversationID, Conversation: {ID: message.ConversationID, LabelIDsAdded: labelIDsAdded}});

            // Send request
            promise = Message.star({IDs: ids}).$promise;

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Unstar a message
         * @param {String} id
         */
        unstarMessage: function(id) {
            var context = tools.cacheContext();
            var ids = [id];
            var events = [];
            var labelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
            var message = cache.getMessageCached(id);
            var messages = cache.queryMessagesCached(message.ConversationID);
            var stars = _.filter(messages, function(message) {
                return message.LabelIDs && message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
            });
            var promise;

            // Messages
            events.push({Action: 3, ID: message.ID, Message: {
                ID: message.ID,
                LabelIDsRemoved: labelIDsRemoved
            }});

            // Conversation
            if(stars.length === 1) {
                events.push({Action: 3, ID: message.ConversationID, Conversation: {ID: message.ConversationID, LabelIDsRemoved: labelIDsRemoved}});
            }

            // Send request
            promise = Message.unstar({IDs: ids}).$promise;

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Mark as read a list of messages
         * @param {Array} ids
         */
        readMessage: function(ids) {
            var context = tools.cacheContext();
            var events = [];
            var promise;
            var conversationIDs = [];

            // Generate message event
            _.each(ids, function(id) {
                var message = cache.getMessageCached(id);

                conversationIDs.push(message.ConversationID);

                events.push({Action: 3, ID: message.ID, Message: {
                    ID: message.ID,
                    ConversationID: message.ConversationID,
                    IsRead: 1
                }});
            });

            // Generate conversation event
            _.each(_.uniq(conversationIDs), function(conversationID) {
                var conversation = cache.getConversationCached(conversationID);
                var messages = cache.queryMessagesCached(conversationID);
                var filtered = _.filter(messages, function(message) {
                    return ids.indexOf(message.ID) !== -1;
                });

                if(angular.isDefined(conversation)) {
                    events.push({Action: 3, ID: conversation.ID, Conversation: {
                        ID: conversation.ID,
                        NumUnread: conversation.NumUnread - filtered.length
                    }});
                }
            });

            // Send request
            promise = Message.read({IDs: ids}).$promise;

            if(context === true) {
                // Send cache events
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Mark as unread a list of messages
         * @param {Array} ids
         */
        unreadMessage: function(ids) {
            var context = tools.cacheContext();
            var events = [];
            var promise;
            var conversationIDs = [];

            // Generate message event
            _.each(ids, function(id) {
                var message = cache.getMessageCached(id);

                conversationIDs.push(message.ConversationID);

                events.push({Action: 3, ID: message.ID, Message: {
                    ID: message.ID,
                    ConversationID: message.ConversationID,
                    IsRead: 0
                }});
            });

            // Generate conversation event
            _.each(_.uniq(conversationIDs), function(conversationID) {
                var conversation = cache.getConversationCached(conversationID);
                var messages = cache.queryMessagesCached(conversationID);
                var filtered = _.filter(messages, function(message) {
                    return ids.indexOf(message.ID) !== -1;
                });

                if(angular.isDefined(conversation)) {
                    events.push({Action: 3, ID: conversation.ID, Conversation: {
                        ID: conversation.ID,
                        NumUnread: conversation.NumUnread + filtered.length
                    }});
                }
            });

            // Send request
            promise = Message.unread({IDs: ids}).$promise;

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Delete a list of messages
         * @param {Array} ids
         */
        deleteMessage: function(ids) {
            var context = tools.cacheContext();
            var events = [];
            var promise;

            // Generate cache events
            _.each(ids, function(id) {
                var message = cache.getMessageCached(id);
                var conversation = cache.getConversationCached(message.ConversationID);

                if(angular.isDefined(conversation)) {
                    if(conversation.NumMessages === 1) {
                        // Delete conversation
                        events.push({Action: 0, ID: conversation.ID});
                    } else if(conversation.NumMessages > 1) {
                        var messages = cache.queryMessagesCached(conversation.ID);
                        var labelIDs = [];

                        _.each(messages, function(message) {
                            if(message.ID !== id) {
                                labelIDs = labelIDs.concat(message.LabelIDs);
                            }
                        });

                        events.push({Action: 3, ID: conversation.ID, Conversation: {
                            ID: conversation.ID,
                            LabelIDs: _.uniq(labelIDs), // Forge LabelIDs
                            NumMessages: conversation.NumMessages - 1 // Decrease the number of message
                        }});
                    }
                }

                events.push({Action: 0, ID: message.ID});
            });

            promise = Message.delete({IDs: ids}).$promise;

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        },
        saveMessage: function() {

        },
        sendMessage: function() {

        },
        /**
         * Discard draft
         * @param {Object} message
         */
        discardMessage: function(message) {
            var context = tools.cacheContext();
            var events = [];
            var conversation = cache.getConversationCached(message.ConversationID);
            var promise;

            // Store ID of message discarded
            $rootScope.discarded.push(message.ID);

            // Generate message event to delete the message
            events.push({Action: 0, ID: message.ID});

            // Generate conversation event
            if(angular.isDefined(conversation)) {
                if(conversation.NumMessages === 1) {
                    // Delete conversation
                    events.push({Action: 0, ID: conversation.ID});
                } else if(conversation.NumMessages > 1) {
                     var messages = cache.queryMessagesCached(conversation.ID);
                     var labelIDs = [];

                     _.each(messages, function(message) {
                         labelIDs = labelIDs.concat(message.LabelIDs);
                     });

                     // Remove one of the draft label
                     labelIDs.splice(labelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts), 1);

                    // Decrease the number of message
                    conversation.NumMessages--;
                    conversation.LabelIDs = _.uniq(labelIDs);
                    events.push({Action: 3, ID: conversation.ID, Conversation: conversation});
                }
            }

            // Send request
            promise = Message.delete({IDs: [message.ID]}).$promise;

            if(context === true) {
                cache.events(events);
            } else {
                promise.then(function() {
                    // Send cache events
                    cache.events(events);
                });

                networkActivityTracker.track(promise);
            }
        }
    };
});
