import _ from 'lodash';
import { flow, uniq, each, map, filter, reduce } from 'lodash/fp';

import { STATUS, MAILBOX_IDENTIFIERS, DRAFT, SENT, INBOX_AND_SENT } from '../../constants';

const REMOVE_ID = 0;
const ADD_ID = 1;

/* @ngInject */
function messageActions(
    $q,
    tools,
    cache,
    contactSpam,
    eventManager,
    messageApi,
    dispatchers,
    networkActivityTracker,
    notification,
    gettextCatalog,
    labelsModel,
    $filter
) {
    const { on } = dispatchers();
    const unicodeTagView = $filter('unicodeTagView');
    const notifySuccess = (message) => notification.success(unicodeTagView(message));

    const basicFolders = [
        MAILBOX_IDENTIFIERS.inbox,
        MAILBOX_IDENTIFIERS.trash,
        MAILBOX_IDENTIFIERS.spam,
        MAILBOX_IDENTIFIERS.archive,
        MAILBOX_IDENTIFIERS.sent,
        MAILBOX_IDENTIFIERS.drafts
    ];

    function getFolderNameTranslated(labelID = '') {
        const { Name } = labelsModel.read(labelID, 'folders') || {};
        const mailboxes = {
            [MAILBOX_IDENTIFIERS.inbox]: gettextCatalog.getString('Inbox', null, 'App folder'),
            [MAILBOX_IDENTIFIERS.spam]: gettextCatalog.getString('Spam', null, 'App folder'),
            [MAILBOX_IDENTIFIERS.drafts]: gettextCatalog.getString('Drafts', null, 'App folder'),
            [MAILBOX_IDENTIFIERS.allDrafts]: gettextCatalog.getString('Drafts', null, 'App folder'),
            [MAILBOX_IDENTIFIERS.sent]: gettextCatalog.getString('Sent', null, 'App folder'),
            [MAILBOX_IDENTIFIERS.allSent]: gettextCatalog.getString('Sent', null, 'App folder'),
            [MAILBOX_IDENTIFIERS.trash]: gettextCatalog.getString('Trash', null, 'App folder'),
            [MAILBOX_IDENTIFIERS.archive]: gettextCatalog.getString('Archive', null, 'App folder')
        };
        return mailboxes[labelID] || Name;
    }

    on('messageActions', (event, { type = '', data = {} }) => {
        switch (type) {
            case 'move':
                move(data);
                break;
            case 'star':
                star(data.ids);
                break;
            case 'unstar':
                unstar(data.ids);
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
            case 'folder':
                move(data);
                break;
            default:
                break;
        }
    });

    function updateLabelsAdded(Type, labelID) {
        const toInbox = labelID === MAILBOX_IDENTIFIERS.inbox;

        if (toInbox) {
            switch (Type) {
                // This message is a draft, if you move it to trash and back to inbox, it will go to draft instead
                case DRAFT:
                    return [MAILBOX_IDENTIFIERS.allDrafts, MAILBOX_IDENTIFIERS.drafts];
                // This message is sent, if you move it to trash and back, it will go back to sent
                case SENT:
                    return [MAILBOX_IDENTIFIERS.allSent, MAILBOX_IDENTIFIERS.sent];
                // Type 3 is inbox and sent, (a message sent to yourself), if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
                case INBOX_AND_SENT:
                    return [MAILBOX_IDENTIFIERS.inbox, MAILBOX_IDENTIFIERS.allSent, MAILBOX_IDENTIFIERS.sent];
            }
        }

        return [labelID];
    }

    // Message actions
    function move({ ids, labelID }) {
        const folders = labelsModel.ids('folders');
        const labels = labelsModel.ids('labels');
        const toTrash = labelID === MAILBOX_IDENTIFIERS.trash;
        const toSpam = labelID === MAILBOX_IDENTIFIERS.spam;
        const folderIDs =
            toSpam || toTrash ? basicFolders.concat(folders).concat(labels) : basicFolders.concat(folders);
        const eventList = flow(
            map((id) => {
                const message = cache.getMessageCached(id) || {};
                let labelIDs = message.LabelIDs || [];
                const labelIDsAdded = updateLabelsAdded(message.Type, labelID);
                const labelIDsRemoved = labelIDs.filter((labelID) => folderIDs.indexOf(labelID) > -1);

                if (Array.isArray(labelIDsRemoved)) {
                    labelIDs = _.difference(labelIDs, labelIDsRemoved);
                }

                if (Array.isArray(labelIDsAdded)) {
                    labelIDs = _.uniq(labelIDs.concat(labelIDsAdded));
                }

                if (toSpam) {
                    const { Sender = {} } = message;
                    contactSpam([Sender.Address]);
                }

                return {
                    Action: 3,
                    ID: id,
                    Message: {
                        ID: id,
                        ConversationID: message.ConversationID,
                        Selected: false,
                        LabelIDs: labelIDs,
                        Unread: toTrash ? 0 : message.Unread
                    }
                };
            }),
            reduce((acc, event) => ((acc[event.ID] = event), acc), {})
        )(ids);
        const events = _.reduce(
            eventList,
            (acc, event) => {
                const conversation = cache.getConversationCached(event.Message.ConversationID);
                const messages = cache.queryMessagesCached(event.Message.ConversationID);

                acc.push(event);

                if (conversation && Array.isArray(messages)) {
                    const Labels = flow(
                        reduce((acc, { ID, LabelIDs = [] }) => {
                            const list = eventList[ID] ? eventList[ID].Message.LabelIDs : LabelIDs;
                            return acc.concat(list);
                        }, []),
                        uniq,
                        map((ID) => ({ ID }))
                    )(messages);

                    acc.push({
                        Action: 3,
                        ID: conversation.ID,
                        Conversation: {
                            ID: conversation.ID,
                            Labels
                        }
                    });
                }

                return acc;
            },
            []
        );

        // Send request
        const promise = messageApi.label({ LabelID: labelID, IDs: ids });
        cache.addToDispatcher(promise);

        const notification = gettextCatalog.getPlural(
            ids.length,
            '1 message moved to {{folder}}',
            '{{number}} messages moved to {{folder}}',
            {
                folder: getFolderNameTranslated(labelID),
                number: ids.length
            },
            'Action'
        );

        if (tools.cacheContext()) {
            cache.events(events);
            return notifySuccess(notification);
        }

        // Send cache events
        promise.then(() => (cache.events(events), notifySuccess(notification)));
        networkActivityTracker.track(promise);
    }

    /**
     * Detach a label from a message
     * @param  {String} messageID
     * @param  {String} conversationID
     * @param  {String} labelID
     * @return {void}
     */
    function detachLabel(messageID, conversationID, labelID) {
        const events = [];
        const messages = cache.queryMessagesCached(conversationID);

        // Generate event for the message
        events.push({ Action: 3, ID: messageID, Message: { ID: messageID, LabelIDsRemoved: [labelID] } });

        const Labels = flow(
            reduce((acc, { ID, LabelIDs = [] }) => {
                if (ID === messageID) {
                    return acc.concat(LabelIDs.filter((id) => id !== labelID));
                }
                return acc.concat(LabelIDs);
            }, []),
            uniq,
            map((ID) => ({ ID }))
        )(messages);

        events.push({
            Action: 3,
            ID: conversationID,
            Conversation: {
                ID: conversationID,
                Labels
            }
        });

        // Send to cache manager
        cache.events(events);

        // Send request to detach the label
        messageApi.unlabel({ LabelID: labelID, IDs: [messageID] });
    }

    /**
     * Apply labels on a list of messages
     * @param {Array} messages
     * @param {Array} labels
     * @param {Boolean} alsoArchive
     */
    function addLabel(messages, labels, alsoArchive) {
        const context = tools.cacheContext();
        const currentLocation = tools.currentLocation();
        const isStateAllowedRemove =
            _.includes(basicFolders, currentLocation) || labelsModel.contains(currentLocation, 'folders');
        const ids = _.map(messages, 'ID');

        const process = (events) => {
            cache.events(events).then(() => {
                const getLabels = ({ ID }) => {
                    return flow(
                        reduce((acc, { LabelIDs = [] }) => acc.concat(LabelIDs), []),
                        uniq,
                        map((ID) => ({ ID }))
                    )(cache.queryMessagesCached(ID) || []);
                };

                const events2 = _.reduce(
                    messages,
                    (acc, { ConversationID }) => {
                        const conversation = cache.getConversationCached(ConversationID);

                        if (conversation) {
                            conversation.Labels = getLabels(conversation);
                            acc.push({
                                Action: 3,
                                ID: conversation.ID,
                                Conversation: conversation
                            });
                        }

                        return acc;
                    },
                    []
                );

                cache.events(events2);

                if (alsoArchive === true) {
                    messageApi.archive({ IDs: ids }); // Send request to archive conversations
                }
            });
        };

        const filterLabelsID = (list = [], cb = angular.noop) => {
            return flow(filter(cb), map(({ ID }) => ID))(list);
        };

        const mapPromisesLabels = (list = [], Action) => {
            return _.map(list, (LabelID) => messageApi[Action === ADD_ID ? 'label' : 'unlabel']({ LabelID, IDs: ids }));
        };

        const { events, promises } = _.reduce(
            messages,
            (acc, message) => {
                const msgLabels = (message.LabelIDs || []).filter((v) => isNaN(+v));
                // Selected can equals to true / false / null
                const toApply = filterLabelsID(
                    labels,
                    ({ ID, Selected }) => Selected === true && !_.includes(msgLabels, ID)
                );
                const toRemove = filterLabelsID(
                    labels,
                    ({ ID, Selected }) => Selected === false && _.includes(msgLabels, ID)
                );

                if (alsoArchive === true) {
                    toApply.push(MAILBOX_IDENTIFIERS.archive);

                    if (isStateAllowedRemove) {
                        toRemove.push(currentLocation);
                    }
                }

                acc.events.push({
                    Action: 3,
                    ID: message.ID,
                    Message: {
                        ID: message.ID,
                        Unread: message.Unread,
                        ConversationID: message.ConversationID,
                        Selected: false,
                        LabelIDsAdded: toApply,
                        LabelIDsRemoved: toRemove
                    }
                });

                acc.promises = acc.promises
                    .concat(mapPromisesLabels(toApply, ADD_ID))
                    .concat(mapPromisesLabels(toRemove, REMOVE_ID));

                return acc;
            },
            { events: [], promises: [] }
        );

        const promise = $q.all(promises);
        cache.addToDispatcher(promise);

        if (context === true) {
            return process(events);
        }

        promise.then(() => process(events));
        networkActivityTracker.track(promise);
    }

    /**
     * Star a message
     * @param {Array} ids
     */
    function star(ids) {
        const promise = messageApi.star({ IDs: ids });
        const LabelIDsAdded = [MAILBOX_IDENTIFIERS.starred];

        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise.then(() => eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const events = flow(
            map((id) => cache.getMessageCached(id)),
            filter(Boolean),
            reduce((acc, { ID, ConversationID, Unread }) => {
                const conversation = cache.getConversationCached(ConversationID);

                // Messages
                acc.push({
                    Action: 3,
                    ID,
                    Message: { ID, Unread, LabelIDsAdded }
                });

                // Conversation
                if (conversation) {
                    acc.push({
                        Action: 3,
                        ID: ConversationID,
                        Conversation: {
                            ID: ConversationID,
                            LabelIDsAdded,
                            ContextNumUnread: conversation.ContextNumUnread
                        }
                    });
                }

                return acc;
            }, [])
        )(ids);

        cache.events(events);
    }

    /**
     * Unstar a message
     * @param {Array} ids
     */
    function unstar(ids) {
        const promise = messageApi.unstar({ IDs: ids });
        const LabelIDsRemoved = [MAILBOX_IDENTIFIERS.starred];

        cache.addToDispatcher(promise);

        if (!tools.cacheContext()) {
            promise.then(() => eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const events = flow(
            map((id) => cache.getMessageCached(id)),
            filter(Boolean),
            reduce((acc, { ID, ConversationID, Unread }) => {
                const conversation = cache.getConversationCached(ConversationID);
                const messages = cache.queryMessagesCached(ConversationID);
                const stars = _.filter(messages, ({ LabelIDs = [] }) =>
                    _.includes(LabelIDs, MAILBOX_IDENTIFIERS.starred)
                );

                // Messages
                acc.push({
                    Action: 3,
                    ID,
                    Message: { ID, Unread, LabelIDsRemoved }
                });

                // Conversation
                if (stars.length === 1 && conversation) {
                    acc.push({
                        Action: 3,
                        ID: ConversationID,
                        Conversation: {
                            ID: ConversationID,
                            LabelIDsRemoved,
                            ContextNumUnread: conversation.ContextNumUnread
                        }
                    });
                }
                return acc;
            }, [])
        )(ids);

        cache.events(events);
    }

    /**
     * Mark as read a list of messages
     * @param {Array} ids
     */
    function read(ids = []) {
        // Generate message event
        const { messages, conversationIDs, events } = _.reduce(
            ids,
            (acc, ID) => {
                const { Unread, ConversationID, LabelIDs } = cache.getMessageCached(ID) || {};

                if (Unread === 1) {
                    acc.conversationIDs.push(ConversationID);
                    acc.events.push({
                        Action: 3,
                        ID,
                        Message: { ID, ConversationID, Unread: 0 }
                    });
                    acc.messages.push({ LabelIDs, ConversationID });
                }

                return acc;
            },
            { messages: [], conversationIDs: [], events: [] }
        );

        if (!messages.length) {
            return;
        }

        // Generate conversation event
        flow(
            uniq,
            map((id) => cache.getConversationCached(id)),
            filter(Boolean),
            each(({ ID, Labels = [] }) => {
                events.push({
                    Action: 3,
                    ID,
                    Conversation: {
                        ID,
                        Labels: _.map(Labels, (label) => {
                            label.ContextNumUnread -= _.filter(
                                messages,
                                ({ ConversationID = '', LabelIDs = [] }) =>
                                    ID === ConversationID && _.includes(LabelIDs, label.ID)
                            ).length;
                            return label;
                        })
                    }
                });
            })
        )(conversationIDs);

        // Send request
        const promise = messageApi.read({ IDs: ids });
        cache.addToDispatcher(promise);

        if (tools.cacheContext() === true) {
            // Send cache events
            return cache.events(events);
        }
        // Send cache events
        promise.then(() => cache.events(events));
        networkActivityTracker.track(promise);
    }

    /**
     * Mark as unread a list of messages
     * @param {Array} ids
     */
    function unread(ids = []) {
        const context = tools.cacheContext();
        const promise = messageApi.unread({ IDs: ids });

        cache.addToDispatcher(promise);

        if (!context) {
            promise
                .then(() => {
                    // Update the cache to trigger an update (UI)
                    _.each(ids, (id) => {
                        const msg = cache.getMessageCached(id) || {};
                        msg.Unread = 1;
                        cache.updateMessage(msg);
                    });
                })
                .then(() => eventManager.call());
            return networkActivityTracker.track(promise);
        }

        const { messages, conversationIDs, events } = _.reduce(
            ids,
            (acc, ID) => {
                const { Unread, ConversationID, LabelIDs } = cache.getMessageCached(ID) || {};

                if (Unread === 0) {
                    acc.conversationIDs.push(ConversationID);
                    acc.events.push({
                        Action: 3,
                        ID,
                        Message: {
                            ID,
                            ConversationID,
                            Unread: 1
                        }
                    });
                    acc.messages.push({ LabelIDs, ConversationID });
                }

                return acc;
            },
            { messages: [], conversationIDs: [], events: [] }
        );

        if (messages.length) {
            // Generate conversation event
            flow(
                uniq,
                map((id) => cache.getConversationCached(id)),
                filter(Boolean),
                each(({ ID, Labels = [] }) => {
                    events.push({
                        Action: 3,
                        ID,
                        Conversation: {
                            ID,
                            Labels: _.map(Labels, (label) => {
                                label.ContextNumUnread += _.filter(
                                    messages,
                                    ({ ConversationID = '', LabelIDs = [] }) =>
                                        ID === ConversationID && _.includes(LabelIDs, label.ID)
                                ).length;
                                return label;
                            })
                        }
                    });
                })
            )(conversationIDs);
        }

        cache.events(events);
    }

    /**
     * Delete a list of messages
     * @param {Array} ids
     */
    function destroy(IDs) {
        const events = _.reduce(
            IDs,
            (acc, id) => {
                const message = cache.getMessageCached(id);
                const conversation = cache.getConversationCached(message.ConversationID);

                if (conversation) {
                    if (conversation.NumMessages === 1) {
                        acc.push({ Action: STATUS.DELETE, ID: conversation.ID });
                    }

                    if (conversation.NumMessages > 1) {
                        const messages = cache.queryMessagesCached(conversation.ID);
                        const Labels = flow(
                            filter(({ ID }) => ID !== id),
                            reduce((acc, { LabelIDs = [] }) => acc.concat(LabelIDs), []),
                            uniq,
                            map((ID) => ({ ID }))
                        )(messages);

                        acc.push({
                            Action: STATUS.UPDATE_FLAGS,
                            ID: conversation.ID,
                            Conversation: {
                                ID: conversation.ID,
                                Labels,
                                NumMessages: conversation.NumMessages - 1 // Decrease the number of message
                            }
                        });
                    }
                }

                acc.push({ Action: STATUS.DELETE, ID: message.ID });
                return acc;
            },
            []
        );

        const promise = messageApi.delete({ IDs });
        cache.addToDispatcher(promise);

        if (tools.cacheContext() === true) {
            cache.events(events);
            return promise;
        }

        // Send cache events
        promise.then(() => cache.events(events));
        networkActivityTracker.track(promise);
        return promise;
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
        addLabel,
        star,
        unstar,
        read,
        unread,
        destroy,
        discardMessage
    };
}
export default messageActions;
