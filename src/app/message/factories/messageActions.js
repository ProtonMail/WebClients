angular.module('proton.message')
    .factory('messageActions', ($q, $rootScope, tools, cache, Message, networkActivityTracker, gettextCatalog, notify, CONSTANTS) => {

        const notifySuccess = (message) => notify({ message, classes: 'notification-success' });

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

        $rootScope.$on('messageActions', (event, {action = '', data = {}}) => {
            switch (action) {
                case 'move':
                    api.moveMessage(data.ids, data.mailbox);
                    break;
                case 'star':
                    api.starMessage(data.id);
                    break;
                case 'unstar':
                    api.unstarMessage(data.id);
                    break;
                case 'read':
                    api.readMessage(data.ids);
                    break;
                case 'unread':
                    api.unreadMessage(data.ids);
                    break;
                case 'delete':
                    api.deleteMessage(data.ids);
                    break;
                case 'unlabel':
                    api.detachLabel(data.messageID, data.conversationID, data.labelID);
                    break;
                case 'label':
                    api.labelMessage(data.messages, data.labels, data.alsoArchive);
                    break;
                default:
                    break;
            }
        });

        const api = {
            // Message actions
            moveMessage(ids, mailbox) {
                const context = tools.cacheContext();
                const toInbox = mailbox === 'inbox';
                const toTrash = mailbox === 'trash';
                const remove = [
                  CONSTANTS.MAILBOX_IDENTIFIERS.starred,
                  CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
                  CONSTANTS.MAILBOX_IDENTIFIERS.sent
                ];

                const events = _.chain(ids)
                    .map((id) => {
                        const message = cache.getMessageCached(id);
                        let labelIDs = message.LabelIDs || [];
                        let labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
                        const labelIDsRemoved = _.reject(message.LabelIDs, (labelID) => {
                            const index = remove.indexOf(labelID);
                            return (index !== -1 && remove[index] === labelID) || labelID.length > 2;
                         });


                        if (toInbox === true) {

                            switch(message.Type) {
                                // This message is a draft, if you move it to trash and back to inbox, it will go to draft instead
                                case 1:
                                    const index = labelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox);

                                    labelIDsAdded.splice(index, 1);
                                    labelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.drafts);
                                    break;

                                // This message is sent, if you move it to trash and back, it will go back to sent
                                case 2:
                                    const pos = labelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox);

                                    labelIDsAdded.splice(pos, 1);
                                    labelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                                    break;

                                // Type 3 is inbox and sent, (a message sent to yourself), if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
                                case 3:
                                    labelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                                    break;
                            }
                        }

                        if (Array.isArray(labelIDsRemoved)) {
                            labelIDs = _.difference(labelIDs, labelIDsRemoved);
                        }

                        if (Array.isArray(labelIDsAdded)) {
                            labelIDs = _.uniq(labelIDs.concat(labelIDsAdded));
                        }

                        return {
                            Action: 3,
                            ID: id,
                            Message: {
                                ID: id,
                                ConversationID: message.ConversationID,
                                Selected: false,
                                LabelIDs: labelIDs,
                                IsRead: toTrash ? 1 : message.IsRead
                            }
                        };

                    })
                    .reduce((acc, event, i, list) => {
                        acc[event.ID] = event;
                        return acc;
                    }, {})
                    .reduce((acc, event, i, eventList) => {

                        const conversation = cache.getConversationCached(event.Message.ConversationID);
                        const messages = cache.queryMessagesCached(event.Message.ConversationID);

                        acc.push(event);

                        if (conversation && Array.isArray(messages)) {

                            const labelIDs = _.reduce(messages, (acc, { ID, LabelIDs = [] }) => {
                                const found = _.find(eventList, ({ Message = {} }) => ID === Message.ID);

                                if (found) {
                                    return acc.concat(found.Message.LabelIDs);
                                }

                                return acc.concat(LabelIDs);
                            }, []);

                            acc.push({
                                Action: 3,
                                ID: conversation.ID,
                                Conversation: {
                                    ID: conversation.ID,
                                    LabelIDs: _.uniq(labelIDs)
                                }
                            });
                        }

                        return acc;

                    }, [])
                    .value();

                 // Send request
                const promise = Message[mailbox]({IDs: ids}).$promise;
                cache.addToDispatcher(promise);

                const message = gettextCatalog.getPlural(ids.length, 'Message moved to', 'Messages moved to', null);
                const notification = `${message} ${getFolderNameTranslated(mailbox)}`;

                if (context === true) {
                    cache.events(events);
                    return notifySuccess(notification);
                }

                // Send cache events
                promise.then(() => (cache.events(events), notifySuccess(notification)));
                networkActivityTracker.track(promise);
            },
            detachLabel(messageID, conversationID, labelID) {
                const events = [];
                const REMOVE = 0;
                const messages = cache.queryMessagesCached(conversationID);

                // Generate event for the message
                events.push({Action: 3, ID: messageID, Message: {ID: messageID, LabelIDsRemoved: [labelID]}});

                // Generate event for the conversation
                const labelIDs = [].concat.apply([], messages.map(({LabelIDs = []}) => LabelIDs));

                // Remove one labelID
                labelIDs.splice(labelIDs.indexOf(labelID), 1);

                events.push({Action: 3, ID: conversationID, Conversation: {ID: conversationID, LabelIDs: _.uniq(labelIDs)}});

                // Send to cache manager
                cache.events(events);

                // Send request to detach the label
                new Message().updateLabels(labelID, REMOVE, [messageID]);
            },
            /**
             * Apply labels on a list of messages
             * @param {Array} messages
             * @param {Array} labels
             * @param {Boolean} alsoArchive
             */
            labelMessage(messages, labels, alsoArchive) {
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
            starMessage(id) {
                var context = tools.cacheContext();
                var ids = [id];
                var events = [];
                var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
                var message = cache.getMessageCached(id);
                var conversation = cache.getConversationCached(message.ConversationID);
                var promise;

                // Messages
                events.push({Action: 3, ID: message.ID, Message: {
                    ID: message.ID,
                    LabelIDsAdded: labelIDsAdded
                }});

                // Conversation
                if (conversation) {
                    events.push({Action: 3, ID: message.ConversationID, Conversation: {ID: message.ConversationID, LabelIDsAdded: labelIDsAdded, NumUnread: conversation.NumUnread}});
                }

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
            unstarMessage(id) {
                var context = tools.cacheContext();
                var ids = [id];
                var events = [];
                var labelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
                var message = cache.getMessageCached(id);
                var conversation = cache.getConversationCached(message.ConversationID);
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
                if (stars.length === 1 && conversation) {
                    events.push({Action: 3, ID: message.ConversationID, Conversation: {ID: message.ConversationID, LabelIDsRemoved: labelIDsRemoved, NumUnread: conversation.NumUnread}});
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
            readMessage(ids = []) {
                var context = tools.cacheContext();
                var events = [];
                var promise;
                var conversationIDs = [];

                // Generate message event
                const messageIDs = ids.filter((ID) => {
                    const {IsRead, ConversationID} = cache.getMessageCached(ID);

                    if (IsRead === 0) {
                        conversationIDs.push(ConversationID);

                        events.push({Action: 3, ID, Message: {
                            ID,
                            ConversationID,
                            IsRead: 1
                        }});

                        return true;
                    } else {
                        return false;
                    }
                });

                if (messageIDs.length) {
                    // Generate conversation event
                    _.each(_.uniq(conversationIDs), function(conversationID) {
                        var conversation = cache.getConversationCached(conversationID);
                        var messages = cache.queryMessagesCached(conversationID);
                        var filtered = _.filter(messages, function(message) {
                            return messageIDs.indexOf(message.ID) !== -1;
                        });

                        if (angular.isDefined(conversation)) {
                            events.push({Action: 3, ID: conversation.ID, Conversation: {
                                ID: conversation.ID,
                                NumUnread: conversation.NumUnread - filtered.length
                            }});
                        }
                    });

                    // Send request
                    promise = Message.read({IDs: messageIDs}).$promise;
                    cache.addToDispatcher(promise);

                    if (context === true) {
                        // Send cache events
                        cache.events(events);
                    } else {
                        promise.then(function() {
                            // Send cache events
                            cache.events(events);
                        });

                        networkActivityTracker.track(promise);
                    }
                }
            },
            /**
             * Mark as unread a list of messages
             * @param {Array} ids
             */
            unreadMessage(ids = []) {
                var context = tools.cacheContext();
                var events = [];
                var promise;
                var conversationIDs = [];

                // Generate message event
                const messageIDs = ids.filter((ID) => {
                    const {IsRead, ConversationID} = cache.getMessageCached(ID);

                    if (IsRead === 1) {
                        conversationIDs.push(ConversationID);

                        events.push({Action: 3, ID, Message: {
                            ID,
                            ConversationID,
                            IsRead: 0
                        }});

                        return true;
                    } else {
                        return false;
                    }
                });

                if (messageIDs.length) {
                    // Generate conversation event
                    _.each(_.uniq(conversationIDs), function(conversationID) {
                        var conversation = cache.getConversationCached(conversationID);
                        var messages = cache.queryMessagesCached(conversationID);
                        var filtered = _.filter(messages, function(message) {
                            return messageIDs.indexOf(message.ID) !== -1;
                        });

                        if(angular.isDefined(conversation)) {
                            events.push({Action: 3, ID: conversation.ID, Conversation: {
                                ID: conversation.ID,
                                NumUnread: conversation.NumUnread + filtered.length
                            }});
                        }
                    });

                    // Send request
                    promise = Message.unread({IDs: messageIDs}).$promise;
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
            /**
             * Discard draft
             * @param {Object} message
             */
            discardMessage: function(message) {
                this.deleteMessage([message.ID]);
            }
        };

        return api;
    });
