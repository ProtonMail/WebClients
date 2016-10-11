angular.module('proton.conversation')
.factory('actionConversation', (
    $q,
    $rootScope,
    gettextCatalog,
    tools,
    cache,
    eventManager,
    Conversation,
    Message,
    networkActivityTracker,
    notify,
    CONSTANTS
) => {
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
        moveConversation(ids, mailbox) {
            const context = tools.cacheContext();
            const promise = Conversation[mailbox](ids);
            const folder = getFolderNameTranslated(mailbox);
            const displaySuccess = () => notify({ message: gettextCatalog.getPlural(ids.length, 'Conversation moved to', 'Conversations moved to', null) + ' ' + folder, classes: 'notification-success' });

            cache.addToDispatcher(promise);

            if (context) {
                const events = [];
                const labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]];
                const toInbox = mailbox === 'inbox';
                const toTrash = mailbox === 'trash';

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
                            } else if (message.Type === 2) { // This message is sent, if you move it to trash and back, it will go back to sent
                                index = copyLabelIDsAdded.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox);

                                copyLabelIDsAdded.splice(index, 1);
                                copyLabelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                            } else if (message.Type === 3) { // Type 3 is inbox and sent, (a message sent to yourself), if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
                                copyLabelIDsAdded.push(CONSTANTS.MAILBOX_IDENTIFIERS.sent);
                            }
                        }

                        events.push({ Action: 3, ID: message.ID, Message: {
                            ID: message.ID,
                            IsRead: toTrash ? 1 : message.IsRead,
                            LabelIDsRemoved: copyLabelIDsRemoved, // Remove current location
                            LabelIDsAdded: copyLabelIDsAdded // Add new location
                        } });
                    });

                    events.push({ Action: 3, ID: element.ID, Conversation: element });
                });

                // Send cache events
                cache.events(events);

                displaySuccess();
            } else {
                promise
                .then(() => eventManager.call())
                .then(() => displaySuccess());

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Apply labels on a list of conversations
         * @param {Array} ids
         * @param {Array} labels
         * @param {Boolean} alsoArchive
         */
        labelConversation(ids, labels, alsoArchive) {
            const context = tools.cacheContext();
            const REMOVE = 0;
            const ADD = 1;
            const promises = [];
            const events = [];
            const current = tools.currentLocation();
            const process = () => {
                cache.events(events);

                if (alsoArchive === true) {
                    Conversation.archive(ids); // Send request to archive conversations
                }
            };
            const toApplyConversation = _.chain(labels)
                .filter((label) => { return label.Selected === true; })
                .map((label) => { return label.ID; })
                .value() || [];

            const toRemoveConversation = _.chain(labels)
                .filter((label) => { return label.Selected === false; })
                .map((label) => { return label.ID; })
                .value() || [];

            if (alsoArchive === true) {
                toApplyConversation.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive);

                if (tools.currentMailbox() !== 'label') {
                    toRemoveConversation.push(current);
                }
            }

            ids.forEach((conversationID) => {
                const conversation = cache.getConversationCached(conversationID);
                const messages = cache.queryMessagesCached(conversationID);

                if (angular.isArray(messages) && messages.length > 0) {
                    messages.forEach((message) => {
                        const toApplyMessage = _.chain(labels)
                            .filter((label) => {
                                return label.Selected === true;
                            })
                            .map((label) => {
                                return label.ID;
                            })
                            .value() || [];

                        const toRemoveMessage = _.chain(labels)
                            .filter((label) => {
                                return label.Selected === false;
                            })
                            .map((label) => {
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

                        events.push({ Action: 3, ID: message.ID, Message: {
                            ID: message.ID,
                            LabelIDsAdded: toApplyMessage,
                            LabelIDsRemoved: toRemoveMessage
                        } });
                    });
                }

                if (angular.isDefined(conversation)) {
                    events.push({ Action: 3, ID: conversationID, Conversation: {
                        ID: conversationID,
                        Selected: false,
                        LabelIDsAdded: toApplyConversation,
                        LabelIDsRemoved: toRemoveConversation
                    } });
                }
            });

            _.each(toApplyConversation, (labelID) => {
                promises.push(Conversation.labels(labelID, ADD, ids));
            });

            _.each(toRemoveConversation, (labelID) => {
                promises.push(Conversation.labels(labelID, REMOVE, ids));
            });

            const promise = $q.all(promises);
            cache.addToDispatcher(promise);

            if (context === true) {
                process();
            } else {
                promise.then(() => process());

                networkActivityTracker.track(promise);
            }
        },
        /**
         * Star conversation
         * @param {String} id - conversation id
         */
        starConversation(id) {
            const context = tools.cacheContext();
            const promise = Conversation.star([id]);

            cache.addToDispatcher(promise);

            if (context) {
                const conversation = cache.getConversationCached(id);
                const events = [];

                const element = {
                    ID: id,
                    LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.starred],
                    NumUnread: conversation.NumUnread
                };
                const messages = cache.queryMessagesCached(element.ID);

                // Generate message changes with event
                if (messages.length > 0) {
                    messages.forEach((message) => {
                        events.push({ ID: message.ID, Action: 3, Message: {
                            ID: message.ID,
                            LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.starred]
                        } });
                    });
                }

                // Generate conversation changes with event
                events.push({ ID: element.ID, Action: 3, Conversation: element });

                cache.events(events);
            } else {
                promise.then(eventManager.call());
                networkActivityTracker.track(promise);
            }
        },
        /**
         * Unstar conversation
         * @param {String} id - conversation id
         */
        unstarConversation(id) {
            const context = tools.cacheContext();
            const promise = Conversation.unstar([id]);

            cache.addToDispatcher(promise);

            if (context) {
                const conversation = cache.getConversationCached(id);
                const events = [];
                const element = {
                    ID: id,
                    LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.starred],
                    NumUnread: conversation.NumUnread
                };
                const messages = cache.queryMessagesCached(element.ID);

                // Generate message changes with event
                if (messages.length > 0) {
                    messages.forEach((message) => {
                        events.push({ ID: message.ID, Action: 3, Message: {
                            ID: message.ID,
                            LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.starred]
                        } });
                    });
                }

                // Generate conversation changes with event
                events.push({ ID: element.ID, Action: 3, Conversation: element });

                cache.events(events);
            } else {
                promise.then(eventManager.call());
                networkActivityTracker.track(promise);
            }
        },
        /**
         * Mark as read a list of conversation
         * @param {Array} ids
         */
        readConversation(ids = []) {
            const context = tools.cacheContext();
            const promise = Conversation.read(ids);

            cache.addToDispatcher(promise);

            if (context) {
                const events = [];

                // Generate cache events
                ids.forEach((id) => {
                    const element = {
                        ID: id
                    };
                    const messages = cache.queryMessagesCached(element.ID);

                    element.NumUnread = 0;

                    if (messages.length > 0) {
                        messages.forEach((message) => {
                            events.push({ Action: 3, ID: message.ID, Message: {
                                ID: message.ID,
                                IsRead: 1
                            } });
                        });
                    }

                    events.push({ Action: 3, ID: element.ID, Conversation: element });
                });

                cache.events(events);
            } else {
                promise.then(eventManager.call());
                networkActivityTracker.track(promise);
            }
        },
        /**
         * Mark as unread a list of conversation
         * @param {Array} ids
         */
        unreadConversation(ids = []) {
            const context = tools.cacheContext();
            const promise = Conversation.unread(ids);

            cache.addToDispatcher(promise);

            if (context) {
                const events = [];
                // Generate cache events
                ids.forEach((id) => {
                    const element = { ID: id };
                    const messages = cache.queryMessagesCached(element.ID);

                    const conversation = cache.getConversationCached(id);
                    element.NumUnread = conversation.NumUnread + 1;

                    if (messages.length > 0) {
                        const last = _.chain(messages).sortBy((message) => { return message.Time; }).last().value();

                        events.push({ Action: 3, ID: last.ID, Message: {
                            ID: last.ID,
                            IsRead: 0
                        } });
                    }

                    events.push({ Action: 3, ID: element.ID, Conversation: element });
                });

                cache.events(events);
            } else {
                promise.then(eventManager.call());
                networkActivityTracker.track(promise);
            }
        },
        /**
         * Delete a list of conversations
         * @param {ids}
         */
        deleteConversation(ids = []) {
            const context = tools.cacheContext();
            const promise = Conversation.delete(ids);

            cache.addToDispatcher(promise);

            if (context) {
                const events = [];

                // Generate cache event
                ids.forEach((conversationID) => {
                    const messages = cache.queryMessagesCached(conversationID); // Get messages cached for this conversation

                    $rootScope.$broadcast('deleteConversation', conversationID); // Close composer

                    messages.forEach((message) => {
                        if (message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash)) {
                            events.push({ Action: 0, ID: message.ID });
                        }
                    });

                    events.push({ Action: 0, ID: conversationID });
                });

                cache.events(events);
            } else {
                promise.then(eventManager.call());
                networkActivityTracker.track(promise);
            }
        }
    };
});
