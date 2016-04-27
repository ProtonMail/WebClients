angular.module('proton.actions', [])

.factory('action', function(
    $q,
    $rootScope,
    gettextCatalog,
    tools,
    cache,
    Conversation,
    Message,
    networkActivityTracker,
    notify,
    CONSTANTS
) {
    var findCurrentLocation = function(message) {
        var locations = [
            CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
            CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
            CONSTANTS.MAILBOX_IDENTIFIERS.sent,
            CONSTANTS.MAILBOX_IDENTIFIERS.trash,
            CONSTANTS.MAILBOX_IDENTIFIERS.spam,
            CONSTANTS.MAILBOX_IDENTIFIERS.archive
        ];

        if (angular.isArray(message.LabelIDs)) {
            return _.chain(message.LabelIDs).intersection(locations).first().value();
        }
    };

    var getFolderNameTranslated = function(mailbox) {
        var mailboxs = {
            inbox: gettextCatalog.getString('Inbox', null),
            spam: gettextCatalog.getString('Spam', null),
            drafts: gettextCatalog.getString('Drafts', null),
            sent: gettextCatalog.getString('Sent', null),
            trash: gettextCatalog.getString('Trash', null),
            archive: gettextCatalog.getString('Archive', null)
        };

        return mailboxs[mailbox];
    };

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
            var promise;
            var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
            var toInbox = mailbox === 'inbox';
            var current = tools.currentLocation();
            var labelIDsRemoved = [];
            var folder = getFolderNameTranslated(mailbox);
            var process = function() {
                // Send cache events
                cache.events(events);
                // Display notification
                notify({message: gettextCatalog.getPlural(ids.length, 'Conversation moved to', 'Conversations moved to', null) + ' ' + folder, classes: 'notification-success'});                    
            };

            if (tools.currentMailbox() !== 'label') {
                labelIDsRemoved.push(current);
            }

            // Generate cache events
            _.each(ids, function(id) {
                var conversation = cache.getConversationCached(id);
                var messages = cache.queryMessagesCached(id);
                var element = {
                    ID: id,
                    Selected: false,
                    LabelIDsRemoved: labelIDsRemoved, // Remove current location
                    LabelIDsAdded: labelIDsAdded // Add new location
                };

                _.each(messages, function(message) {
                    var copyLabelIDsAdded = angular.copy(labelIDsAdded);
                    var copyLabelIDsRemoved = angular.copy(labelIDsRemoved);

                    if(toInbox === true) {
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

                events.push({Action: 3, ID: element.ID, Conversation: element});
            });

            // Send request
            promise = Conversation[mailbox](ids);
            cache.addToDispatcher(promise);

            if (context === true) {
                process();
            } else {
                promise.then(function() {
                    process();
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
                notify({message: gettextCatalog.getString('Labels saved', null), classes: 'notification-success'});

                if(alsoArchive === true) {
                    Conversation.archive(ids); // Send request to archive conversations
                }
            };
            var toApplyConversation = _.chain(labels)
                .filter(function(label) { return label.Selected === true; })
                .map(function(label) { return label.ID; })
                .value() || [];

            var toRemoveConversation = _.chain(labels)
                .filter(function(label) { return label.Selected === false; })
                .map(function(label) { return label.ID; })
                .value() || [];

            if (alsoArchive === true) {
                toApplyConversation.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive);

                if (tools.currentMailbox() !== 'label') {
                    toRemoveConversation.push(current);
                }
            }

            _.each(ids, function(conversationID) {
                var conversation = cache.getConversationCached(conversationID);
                var messages = cache.queryMessagesCached(conversationID);

                if (angular.isArray(messages) && messages.length > 0) {
                    _.each(messages, function(message) {
                        var toApplyMessage = _.chain(labels)
                            .filter(function(label) {
                                return label.Selected === true;
                            })
                            .map(function(label) {
                                return label.ID;
                            })
                            .value() || [];

                        var toRemoveMessage = _.chain(labels)
                            .filter(function(label) {
                                return label.Selected === false;
                            })
                            .map(function(label) {
                                return label.ID;
                            })
                            .value() || [];

                        message.LabelIDs = message.LabelIDs || [];

                        if (alsoArchive === true) {
                            toApplyMessage.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive);

                            if (tools.currentMailbox() !== 'label') {
                                toRemoveMessage.push(current);
                            }
                        }

                        events.push({Action: 3, ID: message.ID, Message: {
                            ID: message.ID,
                            LabelIDsAdded: toApplyMessage,
                            LabelIDsRemoved: toRemoveMessage
                        }});
                    });
                }

                if (angular.isDefined(conversation)) {
                    events.push({Action: 3, ID: conversationID, Conversation: {
                        ID: conversationID,
                        Selected: false,
                        LabelIDsAdded: toApplyConversation,
                        LabelIDsRemoved: toRemoveConversation
                    }});
                }
            });

            _.each(toApplyConversation, function(labelID) {
                promises.push(Conversation.labels(labelID, ADD, ids));
            });

            _.each(toRemoveConversation, function(labelID) {
                promises.push(Conversation.labels(labelID, REMOVE, ids));
            });

            promise = $q.all(promises);
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
                var labelIDs = message.LabelIDs || [];
                var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
                var inInbox = mailbox === 'inbox';
                var labelIDsRemoved = _.reject(message.LabelIDs, function(labelID) {
                    // Remove starred and labels
                    return labelID === CONSTANTS.MAILBOX_IDENTIFIERS.starred || labelID.length > 2;
                });

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

                if (angular.isArray(labelIDsRemoved)) {
                    labelIDs = _.difference(labelIDs, labelIDsRemoved);
                }

                if (angular.isArray(labelIDsAdded)) {
                    labelIDs = _.uniq(labelIDs.concat(labelIDsAdded));
                }

                events.push({Action: 3, ID: id, Message: {
                    ID: id,
                    ConversationID: message.ConversationID,
                    Selected: false,
                    LabelIDs: labelIDs
                }});
            });

            _.each(events, function(event) {
                var conversation = cache.getConversationCached(event.Message.ConversationID);
                var messages = cache.queryMessagesCached(event.Message.ConversationID);

                if (angular.isDefined(conversation) && angular.isArray(messages)) {
                    var labelIDs = [];

                    _.each(messages, function(message) {
                        var found = _.find(events, function(event) {
                            return message.ID === event.Message.ID;
                        });

                        if (angular.isDefined(found)) {
                            labelIDs = labelIDs.concat(found.Message.LabelIDs);
                        } else {
                            labelIDs = labelIDs.concat(message.LabelIDs);
                        }
                    });

                    events.push({Action: 3, ID: conversation.ID, Conversation: {
                        ID: conversation.ID,
                        LabelIDs: _.uniq(labelIDs)
                    }});
                }
            });

            // Send request
            promise = Message[mailbox]({IDs: ids}).$promise;
            cache.addToDispatcher(promise);

            if (context === true) {
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
                    notify({message: gettextCatalog.getString('Labels saved', null), classes: 'notification-success'});

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

                    if (tools.currentMailbox() !== 'label') {
                        toRemove.push(current);
                    }
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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            cache.addToDispatcher(promise);

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
            var promise;
            var current = findCurrentLocation(message);

            // Generate message event to move the message to trash
            events.push({Action: 3, ID: message.ID, Message: {
                LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.trash],
                LabelIDsRemoved: [current]
            }});

            // Send request
            promise = Message.trash({IDs: [message.ID]}).$promise;
            cache.addToDispatcher(promise);

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
