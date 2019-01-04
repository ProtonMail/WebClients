import _ from 'lodash';
import { flow, filter, each, map, head, maxBy, uniq } from 'lodash/fp';

import { STATUS, MAILBOX_IDENTIFIERS, CONVERSATION_LIMIT, ELEMENTS_PER_PAGE, MESSAGE_LIMIT } from '../../constants';

import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { normalizeEmail } from '../../../helpers/string';
import { isDraft } from '../../../helpers/message';

const { DELETE, CREATE, UPDATE_DRAFT, UPDATE_FLAGS } = STATUS;

/* @ngInject */
function cache(
    $interval,
    $stateParams,
    conversationApi,
    dispatchers,
    firstLoadState,
    messageModel,
    messageApi,
    cacheCounters,
    networkActivityTracker,
    tools,
    labelsModel,
    cachePages,
    recipientsFormator
) {
    const api = {};
    let messagesCached = []; // In this array we store the messages cached
    let conversationsCached = []; // In this array we store the conversations cached
    const disp = [];
    const timeCached = {};
    const missingConversations = [];

    const { inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred } = MAILBOX_IDENTIFIERS;

    const { dispatcher, on } = dispatchers([
        'elements',
        'message.expiration',
        'updatePageName',
        'refreshConversation',
        'message.refresh',
        'foldersElement',
        'foldersMessage',
        'labelsElement'
    ]);
    const dispatchElements = (type, data = {}) => dispatcher.elements(type, data);

    api.addToDispatcher = (action) => disp.push(action);
    api.clearDispatcher = () => (disp.length = 0);
    api.getDispatcher = () => Promise.all(disp);

    $interval(expiration, 1000, 0, false);

    /**
     * Save conversations in conversationsCached and add loc in attribute
     * @param {Array} conversations
     */
    function storeConversations(conversations = []) {
        conversations.forEach((conversation) => updateConversation(conversation));
    }

    /**
     * From the request API we return an array of the pages cached
     * @param  {Number} Page
     * @param  {Number} Limit
     * @return {Array}
     */
    function getPages({ Page = 0, Limit = CONVERSATION_LIMIT }) {
        return _.range(Page, Page + Limit / ELEMENTS_PER_PAGE, 1);
    }

    /**
     * Save messages in cache
     * @param {Array} messages
     */
    function storeMessages(messages = []) {
        messages.forEach((message) => updateMessage(message));
    }

    /**
     * Store time for conversation per location
     * @param {String} conversationId
     * @param {String} loc
     * @param {Integer} time
     */
    function storeTime(conversationId, loc, time) {
        timeCached[conversationId] = timeCached[conversationId] || {};
        timeCached[conversationId][loc] = time;
    }

    /**
     * Update message cached
     * @param {Object} message
     */
    function updateMessage(message, isSend) {
        const current = _.find(messagesCached, { ID: message.ID });
        const { ConversationID } = message;
        const type = tools.getTypeList();

        if (current) {
            messagesCached = _.map(messagesCached, (msg) => {
                // Force update if it's a new message
                if (isSend && msg.ID === message.ID) {
                    return message;
                }

                if (msg.ID === message.ID) {
                    const m = { ...msg, ...message };
                    // It can be 0
                    m.Type = message.Type;
                    return m;
                }

                return msg;
            });
        } else {
            messagesCached.push(message);
        }

        manageTimes(ConversationID);

        dispatcher.labelsElement('', message);
        dispatcher.foldersMessage('', message);
        dispatcher.foldersElement('', message);

        const { loaded } = _.find(conversationsCached, { ID: ConversationID }) || {};

        // We load the conversation when we receive an create / update message event if
        // the conversation is not cached and if the current state display a conversation list
        if (!loaded && type === 'conversation') {
            missingConversations.push(ConversationID);
        }

        return Promise.resolve();
    }

    /**
     * Refresh the list of senders for a conversation
     * The current does not contain the previous list, so we need to
     * merge them.
     * @param  {Array}  previous Previous list of senders
     * @param  {Array}  current  Current list of senders
     * @return {Array}           Current list
     */
    const filterSenderConversation = (previous = [], current = []) => {
        const { list } = _.reduce(
            current.concat(previous),
            (acc, sender) => {
                const normalizedEmail = normalizeEmail(sender.Address);
                if (!acc.map[normalizedEmail]) {
                    acc.list.push(sender);
                    acc.map[normalizedEmail] = true;
                }
                return acc;
            },
            { list: [], map: {} }
        );

        return list;
    };

    /**
     * Search context datas to update the conversation
     * @param {Object} oldElement
     * @param {Object} newElement
     * @return {Object}
     */
    function extractContextDatas(oldElement, newElement) {
        const { Labels = [] } = newElement;
        const ID = tools.currentLocation();
        const {
            ContextNumUnread = oldElement.ContextNumUnread,
            ContextNumAttachments = oldElement.ContextNumAttachments,
            ContextSize = oldElement.ContextSize,
            ContextTime = oldElement.ContextTime
        } = Labels.length ? _.find(Labels, { ID }) || {} : newElement;

        return { ContextNumUnread, ContextNumAttachments, ContextSize, ContextTime };
    }

    /**
     * Update conversation cached
     * @param {Object} conversation
     */
    function updateConversation(conversation) {
        const current = _.find(conversationsCached, { ID: conversation.ID });

        if (current) {
            _.extend(
                current,
                conversation,
                {
                    Labels: getLabels(current, conversation),
                    Senders: filterSenderConversation(current.Senders, conversation.Senders)
                },
                extractContextDatas(current, conversation)
            );
            delete current.LabelIDsAdded;
            delete current.LabelIDsRemoved;
            manageTimes(current.ID);
            dispatcher.labelsElement('', current);
            dispatcher.foldersElement('', current);
            return;
        }

        _.extend(conversation, extractContextDatas(conversation, conversation));
        conversationsCached.push(conversation);
        manageTimes(conversation.ID);
        dispatcher.labelsElement('', conversation);
        dispatcher.foldersElement('', conversation);
    }

    /**
     * Return a vector to calculate the counters
     * @param {Object} element - element to analyse (conversation or message)
     * @param {Boolean} unread - true if unread case
     * @param {String} type = conversation or message
     * @return {Object}
     */
    function vector({ LabelIDs = [], Labels = [], Unread }, unread, type) {
        const toInt = (value) => +!!value;
        const locs = [inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred].concat(
            labelsModel.ids()
        );

        return _.reduce(
            locs,
            (acc, loc) => {
                if (type === 'message') {
                    const test = _.includes(LabelIDs, loc);
                    acc[loc] = toInt(unread ? test && Unread === 1 : test);
                }

                if (type === 'conversation') {
                    const label = _.find(Labels, { ID: loc });
                    acc[loc] = toInt(unread ? label && label.ContextNumUnread > 0 : label);
                }

                return acc;
            },
            {}
        );
    }

    /**
     * Update time for conversation
     * @param {String} conversationID
     */
    function manageTimes(conversationID) {
        if (!conversationID) {
            return;
        }

        const { Labels = [] } = api.getConversationCached(conversationID) || {};
        const messages = api.queryMessagesCached(conversationID, false); // messages are ordered by -Time

        if (messages.length) {
            Labels.forEach(({ ID }) => {
                // Get the most recent message for a specific label
                const { Time } =
                    flow(
                        filter(({ LabelIDs = [] }) => _.includes(LabelIDs, ID)),
                        head
                    )(messages) || {};
                Time && storeTime(conversationID, ID, Time);
            });
        }
    }

    /**
     * Manage the updating to calcultate the total number of messages and unread messages
     * @param {Object} oldElement
     * @param {Object} newElement
     * @param {String} type - 'message' or 'conversation'
     */
    function manageCounters(oldElement, newElement, type) {
        const oldUnreadVector = vector(oldElement, true, type);
        const newUnreadVector = vector(newElement, true, type);
        const newTotalVector = vector(newElement, false, type);
        const oldTotalVector = vector(oldElement, false, type);
        const locs = [inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred].concat(
            labelsModel.ids()
        );

        _.each(locs, (loc) => {
            const deltaUnread = newUnreadVector[loc] - oldUnreadVector[loc];
            const deltaTotal = newTotalVector[loc] - oldTotalVector[loc];
            let currentUnread;
            let currentTotal;

            if (type === 'message') {
                currentUnread = cacheCounters.unreadMessage(loc);
                currentTotal = cacheCounters.totalMessage(loc);
                cacheCounters.updateMessage(loc, currentTotal + deltaTotal, currentUnread + deltaUnread);
            } else if (type === 'conversation') {
                currentUnread = cacheCounters.unreadConversation(loc);
                currentTotal = cacheCounters.totalConversation(loc);
                cacheCounters.updateConversation(loc, currentTotal + deltaTotal, currentUnread + deltaUnread);
            }
        });
    }

    /**
     * Return loc specified in the request
     * @param {Object} request
     * @return {String} loc
     */
    const getLocation = ({ LabelID } = {}) => LabelID;

    /**
     * Call API to get the list of conversations
     * @param {Object} request
     * @return {Promise}
     */
    function queryConversations(request, noCacheCounter = false) {
        const loc = getLocation(request);

        const context = tools.cacheContext();
        request.Limit = request.Limit || CONVERSATION_LIMIT; // We don't call 50 conversations but 100 to improve user experience when he delete message and display quickly the next conversations
        const promise = api
            .getDispatcher()
            .then(() => conversationApi.query(request))
            .then(({ data = {} } = {}) => {
                refreshStateLimit(data);

                _.each(data.Conversations, (conversation) => {
                    conversation.loaded = true; // Mark these conversations as loaded
                    storeTime(conversation.ID, loc, conversation.ContextTime); // Store time value
                });

                // Only for cache context
                if (context) {
                    // Set total value in cache
                    if (!noCacheCounter) {
                        const total = data.Limit;
                        const unread = total === 0 ? 0 : data.Unread;
                        const pages = getPages(request);

                        // Add pages to the cache
                        pages.forEach((page) => !cachePages.inside(page) && cachePages.add(page));

                        cacheCounters.updateConversation(loc, total, unread);
                    }

                    // Store conversations
                    storeConversations(data.Conversations);
                    api.clearDispatcher();
                    // Return conversations ordered
                    return api.orderConversation(data.Conversations.slice(0, ELEMENTS_PER_PAGE), loc);
                }

                api.clearDispatcher();
                return data.Conversations.slice(0, ELEMENTS_PER_PAGE);
            })
            .catch((e) => {
                const { data = {} } = e;

                api.clearDispatcher();
                dispatchElements('error', { code: data.Code, error: data.Error });

                if (data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_SEARCH_QUERY_SYNTAX) {
                    return [];
                }

                throw e;
            });

        networkActivityTracker.track(promise);

        return promise;
    }

    function refreshStateLimit({ Limit, Total }) {
        cacheCounters.currentState(Limit);
        dispatchElements('setLimit', { Limit, Total });
    }

    /**
     * Query api to get messages
     * @param {Object} request
     * @return {Promise}
     */
    function queryMessages(request, noCacheCounter = false) {
        const loc = getLocation(request);
        const context = tools.cacheContext();

        request.Limit = request.Limit || MESSAGE_LIMIT; // We don't call 50 messages but 100 to improve user experience when he delete message and display quickly the next messages

        const promise = api
            .getDispatcher()
            .then(() => messageApi.query(request))
            .then(({ data = {} } = {}) => {
                const { Messages = [], Limit = 0 } = data;

                refreshStateLimit(data);

                _.each(Messages, (message) => {
                    message.loaded = true;
                    message.Senders = [message.Sender];
                    message.Recipients = recipientsFormator.toList(message);
                });

                storeMessages(Messages);

                // Only for cache context
                if (context) {
                    const pages = getPages(request);
                    // Set total value in cache
                    if (!noCacheCounter) {
                        cacheCounters.updateMessage(loc, Limit);
                    }
                    // Add pages to the cache
                    pages.forEach((page) => !cachePages.inside(page) && cachePages.add(page));
                    // Return messages ordered
                    api.clearDispatcher();
                    return api.orderMessage(Messages.slice(0, ELEMENTS_PER_PAGE));
                }

                api.clearDispatcher();
                return Messages.slice(0, ELEMENTS_PER_PAGE);
            })
            .catch((e) => {
                const { data = {} } = e;

                api.clearDispatcher();
                dispatchElements('error', { code: data.Code, error: data.Error });

                if (data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_SEARCH_QUERY_SYNTAX) {
                    return [];
                }

                throw e;
            });

        networkActivityTracker.track(promise);

        return promise;
    }

    /**
     * Get conversation from back-end and store it in the cache
     * @param {String} conversationID
     * @param {String} labelID
     * @return {Promise}
     */
    function getConversation(conversationID = '', labelID = tools.currentLocation()) {
        const promise = conversationApi.get(conversationID).then(({ data = {} } = {}) => {
            const { Conversation = {}, Messages = [] } = data;
            const message =
                flow(
                    filter(({ LabelIDs = [] }) => _.includes(LabelIDs, labelID)),
                    maxBy('Time')
                )(Messages) || {};

            Messages.forEach((message) => (message.loaded = true));
            Conversation.loaded = true;
            Conversation.Time = message.Time;
            storeConversations([Conversation]);
            storeMessages(Messages);

            return angular.copy(Conversation);
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    /**
     * Call the API to get message
     * @param {String} messageID
     * @return {Promise}
     */
    function getMessage(messageID = '') {
        const promise = messageApi.get(messageID).then(({ data = {} } = {}) => {
            const message = data.Message;
            message.loaded = true;
            storeMessages([message]);
            return messageModel(message);
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    api.empty = (labelID) => {
        messagesCached = _.filter(messagesCached, ({ LabelIDs = [] }) => LabelIDs.indexOf(labelID) === -1);

        cacheCounters.updateMessage(labelID, 0);

        _.each(conversationsCached, (conversation) => {
            conversation.Labels = _.filter(conversation.Labels, ({ ID }) => ID !== labelID);
        });

        cacheCounters.updateConversation(labelID, 0);

        dispatchElements('refresh');
    };

    /**
     * Return a list of conversations reordered by Time for a specific location
     * @param {Array} conversations
     * @param {String} loc
     * @return {Array} don't miss this array is reversed
     */
    api.orderConversation = (conversations = [], loc = '') => {
        return reverse(
            conversations.sort((a, b) => {
                if (api.getTime(a.ID, loc) < api.getTime(b.ID, loc)) {
                    return -1;
                }

                if (api.getTime(a.ID, loc) > api.getTime(b.ID, loc)) {
                    return 1;
                }

                if (a.Order < b.Order) {
                    return -1;
                }

                if (a.Order > b.Order) {
                    return 1;
                }

                return 0;
            })
        );
    };

    function reverse(list = []) {
        return _.reduce(list, (acc, item) => (acc.unshift(item), acc), []);
    }

    /**
     * Return a list of messages reordered by Time
     * @param {Array} messages
     * @return {Array} don't miss this array is reversed
     */
    api.orderMessage = (messages = [], doReverse = true) => {
        const list = messages.sort((a, b) => {
            if (a.Time < b.Time) {
                return -1;
            }

            if (a.Time > b.Time) {
                return 1;
            }

            if (a.Order < b.Order) {
                return -1;
            }

            if (a.Order > b.Order) {
                return 1;
            }

            return 0;
        });

        return doReverse ? reverse(list) : list;
    };

    /**
     * Elements ordered
     * @param  {Array}   [elements=[]]    [description]
     * @param  {String}  [type='message'] [description]
     * @param  {Boolean} [doReverse=true] [description]
     * @param  {String}  [loc='']         [description]
     * @return {Array}
     */
    api.orderElements = (elements = [], type = 'message', doReverse = true, loc = '') => {
        const list = elements.sort((a, b) => {
            const timeA = type === 'message' ? a.Time : api.getTime(a.ID, loc);
            const timeB = type === 'message' ? b.Time : api.getTime(b.ID, loc);

            if (timeA < timeB) {
                return -1;
            }

            if (timeA > timeB) {
                return 1;
            }

            if (a.Order < b.Order) {
                return -1;
            }

            if (a.Order > b.Order) {
                return 1;
            }

            return 0;
        });

        return doReverse ? reverse(list) : list;
    };

    /**
     * Return time for a specific conversation and location
     * @return {Integer}
     */
    api.getTime = (conversationId, loc) => {
        if (timeCached[conversationId] && angular.isNumber(timeCached[conversationId][loc])) {
            return timeCached[conversationId][loc];
        }
        return (api.getConversationCached(conversationId) || {}).ContextTime || '';
    };

    /**
     * Return message list
     * @param {Object} request
     * @return {Promise}
     */
    api.queryMessages = (request) => {
        const loc = getLocation(request);
        const context = tools.cacheContext();
        const page = request.Page || 0;

        // In cache context?
        if (context && !firstLoadState.get() && cachePages.consecutive(page)) {
            const start = page * ELEMENTS_PER_PAGE;
            const end = start + ELEMENTS_PER_PAGE;
            let total;
            let number;
            const mailbox = tools.currentMailbox();
            let messages = flow(
                filter(({ LabelIDs = [] }) => LabelIDs.indexOf(loc) !== -1),
                map((message) => messageModel(message))
            )(messagesCached);

            messages = api.orderMessage(messages);

            switch (mailbox) {
                case 'label':
                    total = cacheCounters.totalMessage($stateParams.label);
                    break;
                default:
                    total = cacheCounters.totalMessage(MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            if (angular.isDefined(total)) {
                if (total === 0) {
                    number = 0;
                } else if (total % ELEMENTS_PER_PAGE === 0) {
                    number = ELEMENTS_PER_PAGE;
                } else if (Math.ceil(total / ELEMENTS_PER_PAGE) - 1 === page) {
                    number = total % ELEMENTS_PER_PAGE;
                } else {
                    number = ELEMENTS_PER_PAGE;
                }

                messages = messages.slice(start, end);

                // Supposed total equal to the total cache?
                if (messages.length === number) {
                    cacheCounters.currentState(total);
                    return Promise.resolve(messages);
                }
            }
        }

        return queryMessages(request);
    };

    /**
     * Return conversation list with request specified in cache or call api
     * @param {Object} request
     * @return {Promise}
     */
    api.queryConversations = (request) => {
        const loc = getLocation(request);
        const context = tools.cacheContext();
        const page = request.Page || 0;

        // In cache context?
        if (context && !firstLoadState.get() && cachePages.consecutive(page)) {
            const start = page * ELEMENTS_PER_PAGE;
            const end = start + ELEMENTS_PER_PAGE;
            let total;
            let number;
            const mailbox = tools.currentMailbox();
            let conversations = _.filter(
                conversationsCached,
                ({ Labels = [], ID }) => _.find(Labels, { ID: loc }) && api.getTime(ID, loc)
            );

            conversations = api.orderConversation(conversations, loc);

            switch (mailbox) {
                case 'label':
                    total = cacheCounters.totalConversation($stateParams.label);
                    break;
                default:
                    total = cacheCounters.totalConversation(MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            if (angular.isDefined(total)) {
                if (total === 0) {
                    number = 0;
                } else if (total % ELEMENTS_PER_PAGE === 0) {
                    number = ELEMENTS_PER_PAGE;
                } else if (Math.ceil(total / ELEMENTS_PER_PAGE) - 1 === page) {
                    number = total % ELEMENTS_PER_PAGE;
                } else {
                    number = ELEMENTS_PER_PAGE;
                }

                conversations = conversations.slice(start, end);
                // Supposed total equal to the total cache?
                if (conversations.length === number) {
                    cacheCounters.currentState(total);
                    return Promise.resolve(conversations);
                }
            }
        }

        // Need data from the server
        return queryConversations(request);
    };

    /**
     * Return a copy of messages cached for a specific ConversationID
     * @param {String} conversationID
     * @param {Boolean} loaded
     * @return {Array}
     */
    api.queryMessagesCached = (ConversationID = '', loaded) => {
        const parameters = loaded ? { ConversationID, loaded } : { ConversationID };
        const list = api.orderMessage(_.filter(messagesCached, parameters));
        return list.map(messageModel);
    };

    /**
     * Return conversation cached
     * @param {String} conversationId
     * @return {Object}
     */
    api.getConversationCached = (ID) => angular.copy(_.find(conversationsCached, { ID }));

    /**
     * Return message cached
     * @param {String} messageId
     * @return {Object}
     */
    api.getMessageCached = (ID) => messageModel(_.find(messagesCached, { ID }));

    /**
     * @param {String} conversationID
     * @return {Promise}
     */
    api.getConversation = (ID) => {
        const conversation = _.find(conversationsCached, { ID }) || {};
        const messages = api.queryMessagesCached(ID, true); // messages are ordered by -Time

        if (conversation.loaded === true && messages.length === conversation.NumMessages) {
            return Promise.resolve(angular.copy(conversation));
        }

        return getConversation(ID);
    };

    /**
     * Return the message specified by the id from the cache or the back-end
     * @param {String} ID - Message ID
     * @return {Promise}
     */
    api.getMessage = (ID = '') => {
        const message = _.find(messagesCached, { ID }) || {};

        return new Promise((resolve) => {
            if (message.Body) {
                resolve(messageModel(message));
            } else {
                resolve(api.queryMessage(ID));
            }
        });
    };

    /**
     * Call the BE to get the message from a specific id
     * @param {String} messageId
     * @return {Promise}
     */
    api.queryMessage = getMessage;

    /**
     * Delete message or conversation in the cache if the element is present
     * @param {Object} event
     * @return {Promise}
     */
    api.delete = (event) => {
        // Delete message
        messagesCached = messagesCached.filter(({ ID }) => ID !== event.ID);

        // Delete conversation
        conversationsCached = conversationsCached.filter(({ ID }) => ID !== event.ID);

        return Promise.resolve();
    };

    /**
     * Add a new message in the cache
     * @param {Object} event
     * @return {Promise}
     */
    api.createMessage = (event) => updateMessage(event.Message);

    api.updateMessage = updateMessage;

    /**
     * Add a new conversation in the cache
     * @param {Object} event
     * @return {Promise}
     */
    api.createConversation = ({ Conversation }) => {
        Conversation.loaded = true; // Mark the new conversation as loaded
        updateConversation(Conversation);
        return Promise.resolve();
    };

    /**
     * Update draft conversation
     * @param {Object}
     * @return {Promise}
     */
    api.updateDraftConversation = (event) => (updateConversation(event.Conversation), Promise.resolve());

    /**
     * Update message attached to the id specified
     * @param {Object} event
     * @return {Promise}
     */
    api.updateFlagMessage = (event, isSend) => {
        const current = _.find(messagesCached, { ID: event.ID });

        if (!current) {
            return api.createMessage(event);
        }

        const message = { ...current, ...event.Message };

        // Manage labels
        message.LabelIDs = getLabelsId(current, event.Message);
        delete message.LabelIDsRemoved;
        delete message.LabelIDsAdded;

        return updateMessage(message, isSend);
    };

    /**
     * Call the API to update the message model if it's not a draft
     * In case it's a draft we just update flags
     * @param {Object} event
     * @param {Boolean} isSend
     * @return {Promise}
     */
    api.updateDraftMessage = async (event, isSend) => {
        if (isDraft(event.Message)) {
            return api.updateFlagMessage(event, isSend);
        }

        const { data = {} } = await messageApi.get(event.ID);
        const message = data.Message;

        message.loaded = true;
        storeMessages([message]);

        return messageModel(message);
    };

    /**
     * Update a conversation
     */
    api.updateFlagConversation = (event = {}) => {
        const { loaded } = _.find(conversationsCached, { ID: event.ID }) || {};

        if (loaded) {
            updateConversation(event.Conversation);
        }

        return Promise.resolve();
    };

    function getLabelsId(oldElement = {}, newElement = {}) {
        let labelIDs = newElement.LabelIDs || oldElement.LabelIDs || [];

        if (Array.isArray(newElement.LabelIDsRemoved)) {
            labelIDs = _.difference(labelIDs, newElement.LabelIDsRemoved);
        }

        if (Array.isArray(newElement.LabelIDsAdded)) {
            labelIDs = _.uniq(labelIDs.concat(newElement.LabelIDsAdded));
        }

        return labelIDs;
    }

    function getLabels(old, { Labels = [], LabelIDsRemoved = [], LabelIDsAdded = [], ContextNumUnread = 0 }) {
        if (LabelIDsAdded.length || LabelIDsRemoved.length) {
            const toAdd = _.map(LabelIDsAdded, (ID) => ({ ID, ContextNumUnread }));
            const filtered = _.filter(old.Labels, ({ ID }) => !_.includes(LabelIDsRemoved, ID));
            return _.uniqBy(filtered.concat(toAdd), ({ ID }) => ID);
        }

        if (Labels.length) {
            return _.map(Labels, (label) => {
                const oldLabel = _.find(old.Labels || [], { ID: label.ID });

                if (oldLabel) {
                    return { ...oldLabel, ...label };
                }

                return label;
            });
        }

        return old.Labels || [];
    }

    /**
     * Set new counters value from FE events
     * @param  {Array} events
     */
    function handleCounters(events = []) {
        flow(
            filter((event) => event.Message),
            map((event) => angular.copy(event.Message)),
            each((newMessage) => {
                const oldMessage = _.find(messagesCached, { ID: newMessage.ID });
                if (oldMessage) {
                    newMessage.LabelIDs = getLabelsId(oldMessage, newMessage);
                    manageCounters(oldMessage, newMessage, 'message');
                }
            })
        )(events);

        flow(
            filter((event) => event.Conversation),
            map((event) => angular.copy(event.Conversation)),
            each((newConversation) => {
                const oldConversation = _.find(conversationsCached, { ID: newConversation.ID });
                if (oldConversation) {
                    newConversation.Labels = getLabels(oldConversation, newConversation);
                    manageCounters(oldConversation, newConversation, 'conversation');
                }
            })
        )(events);

        cacheCounters.status();
    }

    const formatCreate = (list = []) => {
        return Promise.all(list.map(({ event, type }) => api[`create${type}`](event)));
    };

    const formatUpdate = (list = []) => {
        const promise = list.map(({ event, type, isSend, item }) => {
            const key = `update${item}${type}`;
            return api[key](event, isSend);
        });
        return Promise.all(promise);
    };

    const formatDelete = (list = []) => Promise.all(list.map(api.delete));

    /**
     * Load missing conversations detected from create / update message event
     * @return {Promise}
     */
    const loadMissingConversations = async (deletedList = []) => {
        const deletedIds = deletedList.map(({ ID }) => ID);
        const promises = flow(
            filter((id) => !_.includes(deletedIds, id)),
            uniq,
            map(getConversation)
        )(missingConversations);
        missingConversations.length = 0;
        await Promise.all(promises);
    };

    /**
     * Manage the cache when a new event comes
     * @param {Array} events - Array of event managing interaction with messages and conversations stored
     * @param {Boolean} fromBackend - indicate if the events come from the back-end
     * @return {Promise}
     */
    const eventProcess = (events = [], fromBackend = false, isSend) => {
        console.log(`[events] from the ${fromBackend ? 'back' : 'front'}-end`, events);

        !fromBackend && handleCounters(events);

        const { Flow, MessageIDs, ConversationIDs } = _.reduce(
            events,
            (acc, event) => {
                const hasType = event.Message || event.Conversation;
                const type = event.Message ? 'Message' : 'Conversation';

                if (hasType) {
                    event[type].ID = event.ID;

                    // NOTE Receiving an event update from the BE means the model stored in the cache is invalid
                    if (fromBackend && event.Action === UPDATE_DRAFT) {
                        event[type].loaded = false;
                    }

                    // NOTE Simulate future change where Labels are updated only from Message events
                    if (fromBackend && type === 'Conversation' && event.Action === UPDATE_FLAGS) {
                        delete event.Conversation.LabelIDsAdded;
                        delete event.Conversation.LabelIDsRemoved;
                    }

                    acc[`${type}IDs`].push(event.ID);
                    event.Action === CREATE && acc.Flow[type].create.push({ event, type });
                    event.Action === UPDATE_DRAFT && acc.Flow[type].update.push({ event, type, isSend, item: 'Draft' });
                    event.Action === UPDATE_FLAGS && acc.Flow[type].update.push({ event, type, isSend, item: 'Flag' });
                }

                event.Action === DELETE && acc.Flow.delete.push(event);

                return acc;
            },
            {
                Flow: {
                    Message: {
                        create: [],
                        update: []
                    },
                    Conversation: {
                        create: [],
                        update: []
                    },
                    delete: []
                },
                MessageIDs: [],
                ConversationIDs: []
            }
        );

        // NOTE Message events must be treated before Conversation events to calculate the Time per Conversation (see manageTimes())
        return formatCreate(Flow.Message.create)
            .then(() => formatUpdate(Flow.Message.update))
            .then(() => loadMissingConversations(Flow.delete))
            .then(() => formatCreate(Flow.Conversation.create))
            .then(() => formatUpdate(Flow.Conversation.update))
            .then(() => formatDelete(Flow.delete))
            .then(() => api.callRefresh(MessageIDs, ConversationIDs));
    };

    api.events = eventProcess;

    /**
     * Ask to the message list controller to refresh the messages
     * First with the cache
     * Second with the query call
     */
    api.callRefresh = (messageIDs = [], conversationIDs = []) => {
        dispatchElements('refresh');
        dispatcher.updatePageName();
        dispatcher.refreshConversation('refresh', conversationIDs);
        dispatcher['message.refresh']('refresh', messageIDs);
        dispatchElements('refresh.time');
    };

    /**
     * Reset cache and hash then preload inbox and sent
     */
    api.reset = () => {
        conversationsCached.length = 0;
        messagesCached.length = 0;
    };

    /**
     * Manage expiration time for messages in the cache
     */
    function expiration() {
        const now = ~~(Date.now() / 1000); // unix timestamp
        const { list, removeList } = _.reduce(
            messagesCached,
            (acc, message = {}) => {
                const { ExpirationTime } = message;
                const test = !(ExpirationTime !== 0 && ExpirationTime < now);
                const key = test ? 'list' : 'removeList';
                acc[key].push(message);
                return acc;
            },
            { list: [], removeList: [] }
        );

        messagesCached = list;
        removeList.length && dispatcher['message.expiration']();
    }

    /**
     * Return previous ID of message specified
     * @param {String} elementID - can be a message ID or a conversation ID
     * @param {Integer} elementTime - UNIX timestamp of the current element
     * @param {String} action - 'next' or 'previous'
     * @return {Promise}
     */
    api.more = (elementID, elementTime, action) => {
        const type = tools.getTypeList();
        const elementsCached = type === 'conversation' ? conversationsCached : messagesCached;
        const loc = tools.currentLocation();
        const noCacheCounter = true;

        const callApi = () => {
            const request = { LabelID: loc };

            if (action === 'next') {
                request.BeginID = elementID;
                request.Begin = elementTime;
                request.Desc = 0;
            } else if (action === 'previous') {
                request.EndID = elementID;
                request.End = elementTime;
            }

            const promise =
                type === 'conversation'
                    ? queryConversations(request, noCacheCounter)
                    : queryMessages(request, noCacheCounter);

            return promise.then((elements = []) => {
                if (elements.length) {
                    const index = action === 'next' ? elements.length - 1 : 0;
                    return elements[index];
                }

                throw new Error('No elements found');
            });
        };

        const elements = elementsCached.filter(({ LabelIDs = [] }) => LabelIDs.indexOf(loc) > -1);
        const elementsOrdered = api.orderElements(elements, type, true, loc);
        const currentElement = _.find(elementsOrdered, { ID: elementID });

        if (currentElement) {
            const currentIndex = _.findIndex(elementsOrdered, { ID: elementID });
            if (action === 'previous' && elementsOrdered[currentIndex + 1]) {
                return Promise.resolve(elementsOrdered[currentIndex + 1]);
            }

            if (action === 'next' && elementsOrdered[currentIndex - 1]) {
                return Promise.resolve(elementsOrdered[currentIndex - 1]);
            }
        }

        return callApi();
    };

    on('$stateChangeStart', (event, toState, toParams, fromState) => {
        if (tools.filteredState(fromState.name) !== tools.filteredState(toState.name)) {
            api.reset();
        }
    });

    on('logout', () => {
        api.reset();
        cacheCounters.reset();
    });

    return api;
}
export default cache;
