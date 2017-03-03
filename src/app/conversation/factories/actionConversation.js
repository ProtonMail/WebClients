angular.module('proton.conversation')
.factory('actionConversation', (
    $rootScope,
    authentication,
    cache,
    CONSTANTS,
    conversationApi,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    notify,
    tools,
    labelsModel
) => {

    const { MAILBOX_IDENTIFIERS } = CONSTANTS;
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

    /**
     * Delete a list of conversations
     * @param {ids}
     */
    function remove(ids = []) {
        const promise = conversationApi.delete(ids);
        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise.then(eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const events = ids.reduce((acc, ID) => {
            const messages = cache.queryMessagesCached(ID);
            $rootScope.$broadcast('deleteConversation', ID); // Close composer
            _.each(messages, ({ ID }) => acc.push({ Action: 0, ID }));
            acc.push({ Action: 0, ID });
            return acc;
        }, []);

        cache.events(events);
    }

    /**
     * Mark as unread a list of conversation
     * @param {Array} ids
     */
    function unread(ids = []) {
        const promise = conversationApi.unread(ids);
        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise.then(eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const events = ids.reduce((acc, ID) => {
            const messages = cache.queryMessagesCached(ID);
            const conversation = cache.getConversationCached(ID);

            if (messages.length > 0) {
                const { ID } = _.chain(messages)
                    .sortBy(({ Time }) => Time)
                    .last()
                    .value();
                acc.push({
                    ID, Action: 3,
                    Message: { ID, IsRead: 0 }
                });
            }

            acc.push({
                Action: 3, ID,
                Conversation: { ID, NumUnread: conversation.NumUnread + 1 }
            });
            return acc;
        }, []);

        cache.events(events);
    }

    /**
     * Mark as read a list of conversation
     * @param {Array} ids
     */
    function read(ids = []) {
        const promise = conversationApi.read(ids);
        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise.then(eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const events = ids.reduce((acc, ID) => {
            _.each(cache.queryMessagesCached(ID), ({ ID }) => {
                acc.push({
                    ID, Action: 3,
                    Message: { ID, IsRead: 1 }
                });
            });

            acc.push({
                Action: 3, ID,
                Conversation: { ID, NumUnread: 0 }
            });
            return acc;
        }, []);

        cache.events(events);
    }

    /**
     * Unstar conversation
     * @param {Array} ids - conversation ids
     */
    function unstar(ids = []) {
        const promise = conversationApi.unstar(ids);
        const LabelIDsRemoved = [MAILBOX_IDENTIFIERS.starred];

        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise.then(eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const events = _.chain(ids)
            .map((id) => cache.getConversationCached(id))
            .filter(Boolean)
            .reduce((acc, { ID, NumUnread }) => {
                const messages = cache.queryMessagesCached(ID);

                _.each(messages, (message) => {
                    acc.push({
                        Action: 3,
                        ID: message.ID,
                        Message: { ID: message.ID, IsRead: message.IsRead, LabelIDsRemoved }
                    });
                });

                acc.push({
                    Action: 3,
                    ID,
                    Conversation: { ID, NumUnread, LabelIDsRemoved }
                });
                return acc;
            }, [])
            .value();

        cache.events(events);
    }

    /**
     * Star conversation
     * @param {Array} ids - conversation ids
     */
    function star(ids = []) {
        const promise = conversationApi.star(ids);
        const LabelIDsAdded = [MAILBOX_IDENTIFIERS.starred];
        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise.then(eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const events = _.chain(ids)
            .map((id) => cache.getConversationCached(id))
            .filter(Boolean)
            .reduce((acc, { ID, NumUnread }) => {
                const messages = cache.queryMessagesCached(ID);

                _.each(messages, (message) => {
                    acc.push({
                        Action: 3,
                        ID: message.ID,
                        Message: { ID: message.ID, IsRead: message.IsRead, LabelIDsAdded }
                    });
                });

                acc.push({
                    Action: 3,
                    ID,
                    Conversation: { ID, NumUnread, LabelIDsAdded }
                });
                return acc;
            }, [])
            .value();

        cache.events(events);
    }

    /**
     * Apply labels on a list of conversations
     * @param {Array} ids
     * @param {Array} labels
     * @param {Boolean} alsoArchive
     */
    function label(ids, labels, alsoArchive) {
        const currentMailbox = tools.currentMailbox();
        const isStateAllowedRemove = currentMailbox !== 'label' && currentMailbox !== 'starred';
        const REMOVE = 0;
        const ADD = 1;
        const current = tools.currentLocation();
        const process = (events) => {
            cache.events(events);
            // Send request to archive conversations
            (alsoArchive === true) && conversationApi.archive(ids);
        };

        const getLabelsId = (list = [], cb = angular.noop) => {
            return _.chain(list)
               .filter(cb)
               .map(({ ID }) => ID)
               .value() || [];
        };

        const toApplyLabels = getLabelsId(labels, ({ Selected }) => Selected === true);
        const toRemoveLabels = getLabelsId(labels, ({ Selected }) => Selected === false);
        const toApply = [].concat(toApplyLabels);
        const toRemove = [].concat(toRemoveLabels);

        if (alsoArchive === true) {
            toApply.push(MAILBOX_IDENTIFIERS.archive);
            isStateAllowedRemove && toRemove.push(current);
        }

        const events = _.chain(ids)
            .map((id) => cache.getConversationCached(id))
            .filter(Boolean)
            .reduce((acc, { ID, NumUnread }) => {
                const messages = cache.queryMessagesCached(ID);

                _.each(messages, (message) => {
                    const toApply = [].concat(toApplyLabels);
                    const toRemove = [].concat(toRemoveLabels);

                    if (alsoArchive === true) {
                        toApply.push(MAILBOX_IDENTIFIERS.archive);
                        isStateAllowedRemove && toRemove.push(current);
                    }

                    acc.push({
                        Action: 3,
                        ID: message.ID,
                        Message: {
                            ID: message.ID,
                            IsRead: message.IsRead,
                            LabelIDsAdded: toApply,
                            LabelIDsRemoved: toRemove
                        }
                    });
                });

                acc.push({
                    Action: 3,
                    ID,
                    Conversation: {
                        ID,
                        NumUnread,
                        Selected: false,
                        LabelIDsAdded: toApply,
                        LabelIDsRemoved: toRemove
                    }
                });
                return acc;
            }, [])
            .value();

        const getPromises = (list, starter = [], flag = ADD) => {
            return _.reduce(list, (acc, id) => {
                acc.push(conversationApi.labels(id, flag, ids));
                return acc;
            }, starter);
        };

        const promise = Promise.all(getPromises(toRemove, getPromises(toApply), REMOVE));
        cache.addToDispatcher(promise);

        if (tools.cacheContext()) {
            return process(events);
        }

        promise.then(() => process(events));
        networkActivityTracker.track(promise);
    }

    function folder(conversationIDs = [], labelID = '') {
        const displaySuccess = () => notify({ message: gettextCatalog.getPlural(conversationIDs.length, 'Conversation moved', 'Conversations moved', null), classes: 'notification-success' });
        const promise = conversationApi.labels(labelID, 1, conversationIDs)
        .then(() => eventManager.call())
        .then(() => displaySuccess());
        networkActivityTracker.track(promise);
    }

    /**
     * Move conversation
     * @param {Array} ids
     * @param {String} mailbox
     */
    function move(ids, mailbox) {
        const exclusiveLabels = labelsModel.ids('folders');

        const promise = conversationApi[mailbox](ids);
        const folder = getFolderNameTranslated(mailbox);
        const displaySuccess = () => notify({ message: gettextCatalog.getPlural(ids.length, 'Conversation moved to', 'Conversations moved to', null) + ' ' + folder, classes: 'notification-success' });
        const folderIDs = [
            MAILBOX_IDENTIFIERS.inbox,
            MAILBOX_IDENTIFIERS.trash,
            MAILBOX_IDENTIFIERS.spam,
            MAILBOX_IDENTIFIERS.archive
        ].concat(exclusiveLabels);

        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise
                .then(() => eventManager.call())
                .then(() => displaySuccess());
            return networkActivityTracker.track(promise);
        }

        const labelIDsAdded = [MAILBOX_IDENTIFIERS[mailbox]];
        const toTrash = mailbox === 'trash';
        const toInbox = mailbox === 'inbox';

        // Generate cache events
        const events = _.reduce(ids, (acc, ID) => {
            const conversation = cache.getConversationCached(ID);
            const messages = cache.queryMessagesCached(ID);
            const labelIDsRemoved = conversation.LabelIDs.filter((labelID) => folderIDs.indexOf(labelID) > -1);

            _.each(messages, ({ Type, LabelIDs, ID, IsRead }) => {
                const copyLabelIDsAdded = labelIDsAdded.slice(); // Copy
                const copyLabelIDsRemoved = LabelIDs.filter((labelID) => folderIDs.indexOf(labelID) > -1);

                if (toInbox) {
                    /**
                     * Types definition
                     *   - 1: a draft
                     * if you move it to trash and back to inbox, it will go to draft instead
                     *   - 2: is sent
                     *  if you move it to trash and back, it will go back to sent
                     *   - 3: is inbox and sent (a message sent to yourself)
                     * if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
                     */
                    switch (Type) {
                        case 1: {
                            const index = copyLabelIDsAdded.indexOf(MAILBOX_IDENTIFIERS.inbox);
                            copyLabelIDsAdded.splice(index, 1);
                            copyLabelIDsAdded.push(MAILBOX_IDENTIFIERS.drafts);
                            break;
                        }
                        case 2: {
                            const index = copyLabelIDsAdded.indexOf(MAILBOX_IDENTIFIERS.inbox);
                            copyLabelIDsAdded.splice(index, 1);
                            copyLabelIDsAdded.push(MAILBOX_IDENTIFIERS.sent);
                            break;
                        }
                        case 3:
                            copyLabelIDsAdded.push(MAILBOX_IDENTIFIERS.sent);
                            break;
                    }
                }

                acc.push({
                    ID, Action: 3,
                    Message: {
                        ID, IsRead: toTrash ? 1 : IsRead,
                        LabelIDsRemoved: copyLabelIDsRemoved, // Remove current location
                        LabelIDsAdded: copyLabelIDsAdded // Add new location
                    }
                });
            });

            acc.push({
                Action: 3, ID,
                Conversation: {
                    ID, Selected: false,
                    NumUnread: (toTrash) ? 0 : conversation.NumUnread,
                    LabelIDsRemoved: labelIDsRemoved, // Remove current location
                    LabelIDsAdded: labelIDsAdded // Add new location
                }
            });
            return acc;
        }, []);

        cache.events(events);
        displaySuccess();
    }

    return { remove, unread, read, unstar, star, label, folder, move };
});
