angular.module('proton.message')
    .factory('messageActions', ($q, $rootScope, tools, cache, eventManager, Message, networkActivityTracker, CONSTANTS, notify, gettextCatalog) => {

        const REMOVE_ID = 0;
        const ADD_ID = 1;

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

        $rootScope.$on('messageActions', (event, { action = '', data = {} }) => {
            switch (action) {
                case 'move':
                    move(data.ids, data.mailbox);
                    break;
                case 'star':
                    star(data.id);
                    break;
                case 'unstar':
                    unstar(data.id);
                    break;
                case 'read':
                    read(data.ids);
                    break;
                case 'unread':
                    unread(data.ids);
                    break;
                case 'delete':
                    destroy(data.ids);
                    break;
                case 'unlabel':
                    detachLabel(data.messageID, data.conversationID, data.labelID);
                    break;
                case 'label':
                    addLabel(data.messages, data.labels, data.alsoArchive);
                    break;
                default:
                    break;
            }
        });

        function updateLabelsAdded(Type, mailbox) {
            const list = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
            switch (Type) {
                // This message is a draft, if you move it to trash and back to inbox, it will go to draft instead
                case CONSTANTS.DRAFT: {
                    list.push(CONSTANTS.MAILBOX_IDENTIFIERS.drafts);
                    break;
                }
                // This message is sent, if you move it to trash and back, it will go back to sent
                case CONSTANTS.SENT: {
                    list.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                    break;
                }
                // Type 3 is inbox and sent, (a message sent to yourself), if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
                case CONSTANTS.INBOX_AND_SENT:
                    list.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                    break;
            }
            return list;
        }


        // Message actions
        function move(ids, mailbox) {
            const context = tools.cacheContext();
            const toTrash = mailbox === 'trash';
            const events = _.chain(ids)
                .map((id) => {
                    const message = cache.getMessageCached(id);
                    let labelIDs = message.LabelIDs || [];
                    const labelIDsAdded = updateLabelsAdded(message.Type, mailbox);
                    const labelIDsRemoved = message.LabelIDs.filter((labelID) => [
                        CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
                        CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                        CONSTANTS.MAILBOX_IDENTIFIERS.spam,
                        CONSTANTS.MAILBOX_IDENTIFIERS.archive
                    ].indexOf(labelID) > -1);

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
                .reduce((acc, event) => (acc[event.ID] = event, acc), {})
                .reduce((acc, event, i, eventList) => {

                    const conversation = cache.getConversationCached(event.Message.ConversationID);
                    const messages = cache.queryMessagesCached(event.Message.ConversationID);

                    acc.push(event);

                    if (conversation && Array.isArray(messages)) {
                        const labelIDs = _.chain(messages)
                            .map(({ ID, LabelIDs }) => (eventList[ID] ? eventList[ID].Message.LabelIDs : LabelIDs))
                            .flatten()
                            .uniq()
                            .value();

                        acc.push({
                            Action: 3,
                            ID: conversation.ID,
                            Conversation: {
                                ID: conversation.ID,
                                LabelIDs: labelIDs
                            }
                        });
                    }

                    return acc;

                }, [])
                .value();

             // Send request
            const promise = Message[mailbox]({ IDs: ids }).$promise;
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
        }

        function detachLabel(messageID, conversationID, labelID) {
            const events = [];
            const messages = cache.queryMessagesCached(conversationID);

            // Generate event for the message
            events.push({ Action: 3, ID: messageID, Message: { ID: messageID, LabelIDsRemoved: [labelID] } });

            // Generate event for the conversation
            const labelIDs = [].concat(messages.map(({ LabelIDs = [] }) => LabelIDs));

            // Remove one labelID
            labelIDs.splice(labelIDs.indexOf(labelID), 1);

            events.push({
                Action: 3,
                ID: conversationID,
                Conversation: {
                    ID: conversationID,
                    LabelIDs: _.uniq(labelIDs)
                }
            });

            // Send to cache manager
            cache.events(events);

            // Send request to detach the label
            (new Message()).updateLabels(labelID, REMOVE_ID, [messageID]);
        }

        /**
         * Apply labels on a list of messages
         * @param {Array} messages
         * @param {Array} labels
         * @param {Boolean} alsoArchive
         */
        function addLabel(messages, labels, alsoArchive) {
            const context = tools.cacheContext();
            const promises = [];
            const events = [];
            const current = tools.currentLocation();
            const ids = _.map(messages, ({ ID }) => ID);

            const process = () => {
                cache.events(events).then(() => {
                    const events2 = [];

                    _.each(messages, (message) => {
                        const conversationID = message.ConversationID;
                        const conversation = cache.getConversationCached(conversationID);

                        if (angular.isDefined(conversation)) { // In the draft folder, conversation can be undefined
                            const messages = cache.queryMessagesCached(conversationID);
                            let labelIDs = [];

                            _.each(messages, (message) => {
                                labelIDs = labelIDs.concat(message.LabelIDs);
                            });

                            conversation.LabelIDs = _.uniq(labelIDs);
                            events2.push({ Action: 3, ID: conversation.ID, Conversation: conversation });
                        }
                    });

                    cache.events(events2);

                    if (alsoArchive === true) {
                        Message.archive({ IDs: ids }); // Send request to archive conversations
                    }
                });
            };

            const filterLabelsID = (list = [], cb = angular.noop) => {
                return _.chain(labels)
                    .filter(cb)
                    .map(({ ID }) => ID)
                    .value();
            };

            _.each(messages, (message) => {

                const toApply = filterLabelsID(labels, ({ ID, Selected }) => Selected === true && (message.LabelIDs || []).indexOf(ID) === -1);
                const toRemove = filterLabelsID(labels, ({ ID, Selected }) => Selected === false && (message.LabelIDs || []).indexOf(ID) !== -1);

                if (alsoArchive === true) {
                    toApply.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive);

                    if (tools.currentMailbox() !== 'label') {
                        toRemove.push(current);
                    }
                }

                const element = {
                    ID: message.ID,
                    ConversationID: message.ConversationID,
                    Selected: false,
                    LabelIDsAdded: toApply,
                    LabelIDsRemoved: toRemove
                };

                events.push({ Action: 3, ID: element.ID, Message: element });

                _.each(toApply, (labelID) => {
                    promises.push(new Message().updateLabels(labelID, ADD_ID, ids));
                });

                _.each(toRemove, (labelID) => {
                    promises.push(new Message().updateLabels(labelID, REMOVE_ID, ids));
                });
            });

            const promise = $q.all(promises);
            cache.addToDispatcher(promise);

            if (context === true) {
                return process();
            }

            promise.then(() => process());
            networkActivityTracker.track(promise);
        }

        /**
         * Star a message
         * @param {String} id
         */
        function star(id) {
            const events = [];
            const LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
            const { ID, ConversationID } = cache.getMessageCached(id);
            const conversation = cache.getConversationCached(ConversationID);

            // Messages
            events.push({
                Action: 3, ID,
                Message: { ID, LabelIDsAdded }
            });

            // Conversation
            if (conversation) {
                events.push({
                    Action: 3,
                    ID: ConversationID,
                    Conversation: {
                        ID: ConversationID,
                        LabelIDsAdded,
                        NumUnread: conversation.NumUnread
                    }
                });
            }

            // Send request
            const promise = Message.star({ IDs: [id] }).$promise;
            cache.addToDispatcher(promise);

            if (tools.cacheContext() === true) {
                return cache.events(events);
            }

            // Send cache events
            promise.then(() => cache.events(events));
            networkActivityTracker.track(promise);
        }

        /**
         * Unstar a message
         * @param {String} id
         */
        function unstar(id) {
            const events = [];
            const LabelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
            const { ID, ConversationID } = cache.getMessageCached(id);
            const conversation = cache.getConversationCached(ConversationID);
            const messages = cache.queryMessagesCached(ConversationID);
            const stars = _.filter(messages, ({ LabelIDs = [] }) => _.contains(LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.starred));

            // Messages
            events.push({
                Action: 3, ID,
                Message: { ID, LabelIDsRemoved }
            });

            // Conversation
            if (stars.length === 1 && conversation) {
                events.push({
                    Action: 3,
                    ID: ConversationID,
                    Conversation: {
                        ID: ConversationID,
                        LabelIDsRemoved,
                        NumUnread: conversation.NumUnread
                    }
                });
            }

            // Send request
            const promise = Message.unstar({ IDs: [id] }).$promise;
            cache.addToDispatcher(promise);

            if (tools.cacheContext() === true) {
                return cache.events(events);
            }

            // Send cache events
            promise.then(() => cache.events(events));
            networkActivityTracker.track(promise);
        }

        /**
         * Mark as read a list of messages
         * @param {Array} ids
         */
        function read(ids = []) {

            // Generate message event
            const { messageIDs, conversationIDs, events } = _
                .reduce(ids, (acc, ID) => {
                    const { IsRead, ConversationID } = cache.getMessageCached(ID);

                    if (IsRead === 0) {
                        acc.conversationIDs.push(ConversationID);
                        acc.events.push({
                            Action: 3, ID,
                            Message: { ID, ConversationID, IsRead: 1 }
                        });
                        acc.messageIDs.push(ID);
                    }

                    return acc;
                }, { messageIDs: [], conversationIDs: [], events: [] });

            if (messageIDs.length) {
                // Generate conversation event
                _.each(_.uniq(conversationIDs), (conversationID) => {
                    const conversation = cache.getConversationCached(conversationID);
                    const messages = cache.queryMessagesCached(conversationID);
                    const filtered = _.filter(messages, ({ ID }) => _.contains(messageIDs, ID));

                    if (angular.isDefined(conversation)) {
                        events.push({
                            Action: 3,
                            ID: conversation.ID,
                            Conversation: {
                                ID: conversation.ID,
                                NumUnread: conversation.NumUnread - filtered.length
                            }
                        });
                    }
                });

                // Send request
                const promise = Message.read({ IDs: messageIDs }).$promise;
                cache.addToDispatcher(promise);

                if (tools.cacheContext() === true) {
                    // Send cache events
                    return cache.events(events);
                }
                // Send cache events
                promise.then(() => cache.events(events));
                networkActivityTracker.track(promise);
            }
        }

        /**
         * Mark as unread a list of messages
         * @param {Array} ids
         */
        function unread(ids = []) {
            const context = tools.cacheContext();
            const promise = Message.unread({ IDs: ids }).$promise;

            cache.addToDispatcher(promise);

            if (context) {
                const { messageIDs, conversationIDs, events } = _
                .reduce(ids, (acc, ID) => {
                    const { IsRead, ConversationID } = cache.getMessageCached(ID);

                    if (IsRead === 1) {
                        acc.conversationIDs.push(ConversationID);
                        acc.events.push({
                            Action: 3, ID,
                            Message: {
                                ID, ConversationID, IsRead: 0
                            }
                        });
                        acc.messageIDs.push(ID);
                    }

                    return acc;
                }, { messageIDs: [], conversationIDs: [], events: [] });

                if (messageIDs.length) {
                    // Generate conversation event
                    _.each(_.uniq(conversationIDs), (conversationID) => {
                        const conversation = cache.getConversationCached(conversationID);
                        const messages = cache.queryMessagesCached(conversationID);

                        const filtered = _.filter(messages, ({ ID }) => _.contains(messageIDs, ID));

                        if (angular.isDefined(conversation)) {
                            events.push({
                                Action: 3,
                                ID: conversation.ID,
                                Conversation: {
                                    ID: conversation.ID,
                                    NumUnread: conversation.NumUnread + filtered.length
                                }
                            });
                        }
                    });
                }

                cache.events(events);
            } else {
                promise.then(() => eventManager.call());
                networkActivityTracker.track(promise);
            }
        }

        /**
         * Delete a list of messages
         * @param {Array} ids
         */
        function destroy(ids) {
            const events = [];

            // Generate cache events
            _.each(ids, (id) => {
                const message = cache.getMessageCached(id);
                const conversation = cache.getConversationCached(message.ConversationID);

                if (angular.isDefined(conversation)) {
                    if (conversation.NumMessages === 1) {
                        // Delete conversation
                        events.push({ Action: 0, ID: conversation.ID });
                    } else if (conversation.NumMessages > 1) {
                        const messages = cache.queryMessagesCached(conversation.ID);
                        let labelIDs = [];

                        _.each(messages, (message) => {
                            if (message.ID !== id) {
                                labelIDs = labelIDs.concat(message.LabelIDs);
                            }
                        });

                        events.push({
                            Action: 3,
                            ID: conversation.ID,
                            Conversation: {
                                ID: conversation.ID,
                                LabelIDs: _.uniq(labelIDs), // Forge LabelIDs
                                NumMessages: conversation.NumMessages - 1 // Decrease the number of message
                            }
                        });
                    }
                }

                events.push({ Action: 0, ID: message.ID });
            });

            const promise = Message.delete({ IDs: ids }).$promise;
            cache.addToDispatcher(promise);

            if (tools.cacheContext() === true) {
                return cache.events(events);
            }

            // Send cache events
            promise.then(() => cache.events(events));
            networkActivityTracker.track(promise);
        }

        /**
         * Discard draft
         * @param {Object} message
         */
        function discardMessage({ ID }) {
            destroy([ID]);
        }

        return {
            move,
            detachLabel, addLabel,
            star, unstar,
            read, unread,
            destroy, discardMessage
        };
    });
