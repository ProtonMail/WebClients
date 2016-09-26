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
    function getFolderNameTranslated(mailbox) {
        const mailboxs = {
            inbox: gettextCatalog.getString('Inbox', null),
            spam: gettextCatalog.getString('Spam', null),
            drafts: gettextCatalog.getString('Drafts', null),
            sent: gettextCatalog.getString('Sent', null),
            trash: gettextCatalog.getString('Trash', null),
            archive: gettextCatalog.getString('Archive', null)
        };

        return mailboxs[mailbox];
    }

    return {
        // Conversation actions
        /**
         * Move conversation
         * @param {Array} ids
         * @param {String} mailbox
         */
        moveConversation: function(ids, mailbox) {
            let promise;
            const context = tools.cacheContext();
            const events = [];
            const labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
            const toInbox = mailbox === 'inbox';
            const toTrash = mailbox === 'trash';
            const folder = getFolderNameTranslated(mailbox);
            const process = () => {
                // Send cache events
                cache.events(events);
                // Display notification
                notify({message: gettextCatalog.getPlural(ids.length, 'Conversation moved to', 'Conversations moved to', null) + ' ' + folder, classes: 'notification-success'});
            };

            // Generate cache events
            ids.forEach((conversationID) => {
                const conversation = cache.getConversationCached(conversationID);
                const messages = cache.queryMessagesCached(conversationID);
                const labelIDsRemoved = conversation.LabelIDs.filter((labelID) => {
                    return [
                        CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
                        CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                        CONSTANTS.MAILBOX_IDENTIFIERS.spam,
                        CONSTANTS.MAILBOX_IDENTIFIERS.archive
                    ].indexOf(labelID) > -1;
                });

                const element = {
                    ID: conversationID,
                    Selected: false,
                    LabelIDsRemoved: labelIDsRemoved, // Remove current location
                    LabelIDsAdded: labelIDsAdded // Add new location
                };

                messages.forEach((message) => {
                    const copyLabelIDsAdded = labelIDsAdded.slice(); // Copy
                    const copyLabelIDsRemoved = message.LabelIDs.filter((labelID) => {
                        return [
                            CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
                            CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                            CONSTANTS.MAILBOX_IDENTIFIERS.spam,
                            CONSTANTS.MAILBOX_IDENTIFIERS.archive
                        ].indexOf(labelID) > -1;
                    });

                    if (toInbox === true) {
                        let index;

                        if (message.Type === 1) { // This message is a draft, if you move it to trash and back to inbox, it will go to draft instead
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
                        IsRead: toTrash ? 1 : message.IsRead,
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
            var conversation = cache.getConversationCached(id);
            var events = [];
            var promise;
            var element = {
                ID: id,
                LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.starred],
                NumUnread: conversation.NumUnread
            };
            var messages = cache.queryMessagesCached(element.ID);

            // Generate message changes with event
            if (messages.length > 0) {
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
            var conversation = cache.getConversationCached(id);
            var events = [];
            var promise;
            var element = {
                ID: id,
                LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.starred],
                NumUnread: conversation.NumUnread
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
                var conversation;
                var element = { ID: id };
                var messages = cache.queryMessagesCached(element.ID);

                conversation = cache.getConversationCached(id);
                element.NumUnread = conversation.NumUnread + 1;

                if (messages.length > 0) {
                    var last = _.chain(messages).sortBy(function(message) { return message.Time; }).last().value();

                    events.push({Action: 3, ID: last.ID, Message: {
                        ID: last.ID,
                        IsRead: 0
                    }});
                }

                events.push({Action: 3, ID: element.ID, Conversation: element});
            });

            // Send request
            promise = Conversation.unread(ids);
            cache.addToDispatcher(promise);

            if (context === true) {
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
        }
    };
});
