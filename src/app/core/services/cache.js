angular.module('proton.core')
.service('cache', (
    $interval,
    $q,
    $rootScope,
    $state,
    $stateParams,
    CONSTANTS,
    conversationApi,
    firstLoad,
    gettextCatalog,
    messageModel,
    messageApi,
    cacheCounters,
    networkActivityTracker,
    tools,
    labelsModel,
    cachePages
) => {
    const api = {};
    let messagesCached = []; // In this array we store the messages cached
    let conversationsCached = []; // In this array we store the conversations cached
    let dispatcher = [];
    const timeCached = {};
    const INVALID_SEARCH_ERROR_CODE = 15225;

    const { DELETE, CREATE, UPDATE_DRAFT, UPDATE_FLAGS } = CONSTANTS.STATUS;
    const I18N = {
        errorMessages: gettextCatalog.getString('No messages available', null, 'Error'),
        errorConversations: gettextCatalog.getString('No conversations available', null, 'Error')
    };

    const dispatchElements = (type, data = {}) => $rootScope.$emit('elements', { type, data });

    $interval(expiration, 1000, 0, false);

    /**
    * Save conversations in conversationsCached and add loc in attribute
    * @param {Array} conversations
    */
    function storeConversations(conversations = []) {
        conversations.forEach(updateConversation);
    }

    /**
     * From the request API we return an array of the pages cached
     * @param  {Number} Page
     * @param  {Number} Limit
     * @return {Array}
     */
    function getPages({ Page = 0, Limit = CONSTANTS.CONVERSATION_LIMIT }) {
        return _.range(Page, Page + (Limit / CONSTANTS.ELEMENTS_PER_PAGE), 1);
    }

    /**
     * Save messages in cache
     * @param {Array} messages
     */
    function storeMessages(messages = []) {
        messages.forEach(updateMessage);
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
        const current = _.findWhere(messagesCached, { ID: message.ID });

        if (current) {
            messagesCached = _.map(messagesCached, (msg) => {

                // Force update if it's a new message
                if (isSend && msg.ID === message.ID) {
                    return message;
                }

                if (msg.ID === message.ID) {
                    const m = _.extend({}, msg, message);
                    // It can be 0
                    m.Type = message.Type;
                    return m;
                }

                return msg;
            });
        } else {
            messagesCached.push(message);
        }

        manageTimes(message.ConversationID);

        $rootScope.$emit('labelsElement.' + message.ID, message);
        $rootScope.$emit('foldersMessage.' + message.ID, message);
        $rootScope.$emit('foldersElement.' + message.ID, message);
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
        const { list } = current.concat(previous).reduce((acc, sender) => {
            if (!acc.map[sender.Address]) {
                acc.list.push(sender);
                acc.map[sender.Address] = true;
            }
            return acc;
        }, { list: [], map: {} });

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
        } = (Labels.length) ? (_.findWhere(Labels, { ID }) || {}) : newElement;

        return { ContextNumUnread, ContextNumAttachments, ContextSize, ContextTime };
    }

    /**
     * Update conversation cached
     * @param {Object} conversation
     */
    function updateConversation(conversation) {
        const current = _.findWhere(conversationsCached, { ID: conversation.ID });

        if (current) {
            _.extend(
                current,
                conversation,
                { Labels: getLabels(current, conversation), Senders: filterSenderConversation(current.Senders, conversation.Senders) },
                extractContextDatas(current, conversation)
            );
            delete current.LabelIDsAdded;
            delete current.LabelIDsRemoved;
            manageTimes(current.ID);
            $rootScope.$emit('labelsElement.' + current.ID, current);
            $rootScope.$emit('foldersElement.' + current.ID, current);
            return;
        }

        _.extend(conversation, extractContextDatas(conversation, conversation));
        conversationsCached.push(conversation);
        manageTimes(conversation.ID);
        $rootScope.$emit('labelsElement.' + conversation.ID, conversation);
        $rootScope.$emit('foldersElement.' + conversation.ID, conversation);
    }

    /**
     * Return a vector to calculate the counters
     * @param {Object} element - element to analyse (conversation or message)
     * @param {Boolean} unread - true if unread case
     * @param {String} type = conversation or message
     * @return {Object}
     */
    function vector({ LabelIDs = [], Labels = [], IsRead }, unread, type) {
        const toInt = (value) => +!!value;
        const locs = [
            CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
            CONSTANTS.MAILBOX_IDENTIFIERS.allDrafts,
            CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
            CONSTANTS.MAILBOX_IDENTIFIERS.allSent,
            CONSTANTS.MAILBOX_IDENTIFIERS.sent,
            CONSTANTS.MAILBOX_IDENTIFIERS.trash,
            CONSTANTS.MAILBOX_IDENTIFIERS.spam,
            CONSTANTS.MAILBOX_IDENTIFIERS.allmail,
            CONSTANTS.MAILBOX_IDENTIFIERS.archive,
            CONSTANTS.MAILBOX_IDENTIFIERS.starred
        ].concat(labelsModel.ids());

        return _.reduce(locs, (acc, loc) => {
            if (type === 'message') {
                const test = _.contains(LabelIDs, loc);
                acc[loc] = toInt(unread ? (test && IsRead === 0) : test);
            }

            if (type === 'conversation') {
                const label = _.findWhere(Labels, { ID: loc });
                acc[loc] = toInt(unread ? (label && label.ContextNumUnread > 0) : label);
            }

            return acc;
        }, {});
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
        const messages = api.queryMessagesCached(conversationID); // messages are ordered by -Time

        if (messages.length) {
            Labels.forEach(({ ID }) => {
                // Get the most recent message for a specific label
                const { Time } = _.chain(messages)
                    .filter(({ LabelIDs = [] }) => _.contains(LabelIDs, ID))
                    .first()
                    .value() || {};

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
        const locs = [
            CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
            CONSTANTS.MAILBOX_IDENTIFIERS.allDrafts,
            CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
            CONSTANTS.MAILBOX_IDENTIFIERS.allSent,
            CONSTANTS.MAILBOX_IDENTIFIERS.sent,
            CONSTANTS.MAILBOX_IDENTIFIERS.trash,
            CONSTANTS.MAILBOX_IDENTIFIERS.spam,
            CONSTANTS.MAILBOX_IDENTIFIERS.allmail,
            CONSTANTS.MAILBOX_IDENTIFIERS.archive,
            CONSTANTS.MAILBOX_IDENTIFIERS.starred
        ].concat(labelsModel.ids());

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
    const getLocation = ({ Label } = {}) => Label;

    /**
     * Call API to get the list of conversations
     * @param {Object} request
     * @return {Promise}
     */
    function queryConversations(request) {
        const loc = getLocation(request);
        const context = tools.cacheContext();
        request.Limit = request.Limit || CONSTANTS.CONVERSATION_LIMIT; // We don't call 50 conversations but 100 to improve user experience when he delete message and display quickly the next conversations
        const promise = api.getDispatcher()
            .then(() => conversationApi.query(request))
            .then(({ data = {} } = {}) => {
                if (data.Code === 1000) {
                    cacheCounters.currentState(data.Limit);
                    $rootScope.$emit('elements', { type: 'setLimit', data: { limit: data.Limit, total: data.Total } });

                    _.each(data.Conversations, (conversation) => {
                        conversation.loaded = true; // Mark these conversations as loaded
                        storeTime(conversation.ID, loc, conversation.ContextTime); // Store time value
                    });

                    // Only for cache context
                    if (context) {
                        // Set total value in cache
                        const total = data.Limit;
                        const unread = (total === 0) ? 0 : data.Unread;
                        const pages = getPages(request);

                        cacheCounters.updateConversation(loc, total, unread);
                        // Store conversations
                        storeConversations(data.Conversations);
                        // Add pages to the cache
                        pages.forEach((page) => !cachePages.inside(page) && cachePages.add(page));
                        api.clearDispatcher();
                        // Return conversations ordered
                        return api.orderConversation(data.Conversations.slice(0, CONSTANTS.ELEMENTS_PER_PAGE), loc);
                    }

                    api.clearDispatcher();
                    return data.Conversations.slice(0, CONSTANTS.ELEMENTS_PER_PAGE);
                }

                api.clearDispatcher();
                $rootScope.$emit('elements', { type: 'error', data: { code: data.Code, error: data.Error } });

                if (data.Code === INVALID_SEARCH_ERROR_CODE) {
                    return [];
                }

                throw new Error(data.Error || I18N.errorConversations);
            });

        networkActivityTracker.track(promise);

        return promise;
    }

    /**
     * Query api to get messages
     * @param {Object} request
     * @return {Promise}
     */
    function queryMessages(request) {
        const loc = getLocation(request);
        const context = tools.cacheContext();

        request.Limit = request.Limit || CONSTANTS.MESSAGE_LIMIT; // We don't call 50 messages but 100 to improve user experience when he delete message and display quickly the next messages

        const promise = api.getDispatcher()
            .then(() => messageApi.query(request))
            .then(({ data = {} } = {}) => {
                if (data.Code === 1000) {
                    const { Messages = [], Total = 0, Limit = 0 } = data;
                    cacheCounters.currentState(Limit);
                    $rootScope.$emit('elements', { type: 'setLimit', data: { limit: Limit, total: Total } });

                    _.each(Messages, (message) => {
                        const { ToList = [], CCList = [], BCCList = [] } = message;
                        message.loaded = true;
                        message.Senders = [message.Sender];
                        message.Recipients = _.uniq([].concat(ToList, CCList, BCCList));
                    });

                    // Store messages
                    storeMessages(Messages);

                    // Only for cache context
                    if (context) {
                        const pages = getPages(request);
                        // Set total value in cache
                        cacheCounters.updateMessage(loc, Limit);
                        // Add pages to the cache
                        pages.forEach((page) => !cachePages.inside(page) && cachePages.add(page));
                        // Return messages ordered
                        api.clearDispatcher();
                        return api.orderMessage(Messages.slice(0, CONSTANTS.ELEMENTS_PER_PAGE));
                    }

                    api.clearDispatcher();
                    return Messages.slice(0, CONSTANTS.ELEMENTS_PER_PAGE);
                }

                api.clearDispatcher();
                $rootScope.$emit('elements', { type: 'error', data: { code: data.Code, error: data.Error } });

                if (data.Code === INVALID_SEARCH_ERROR_CODE) {
                    return [];
                }

                throw new Error(data.Error || I18N.errorMessages);
            });

        networkActivityTracker.track(promise);

        return promise;
    }

    /**
     * Get conversation from back-end and store it in the cache
     * @param {String} conversationID
     * @return {Promise}
     */
    function getConversation(conversationID = '') {
        const promise = conversationApi.get(conversationID)
            .then(({ data = {} } = {}) => {
                const { Code, Conversation, Messages } = data;

                if (Code === 1000) {
                    const conversation = Conversation;
                    const messages = Messages;
                    const message = _.max(messages, ({ Time }) => Time); // NOTE Seems wrong, we should check Time and LabelIDs

                    messages.forEach((message) => message.loaded = true);
                    conversation.loaded = true;
                    conversation.Time = message.Time;
                    storeConversations([conversation]);
                    storeMessages(messages);

                    return angular.copy(conversation);
                }

                throw new Error(data.Error);
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
        const promise = messageApi.get(messageID)
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                const message = data.Message;
                message.loaded = true;
                storeMessages([message]);
                return messageModel(message);
            }

            throw new Error(data.Error);
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    /**
     * Add action promise to the dispatcher
     * @param {Promise} action
     */
    api.addToDispatcher = (action) => {
        dispatcher.push(action);
    };

    /**
     * Clear the dispatcher
     */
    api.clearDispatcher = () => {
        dispatcher = [];
    };

    /**
     * Return the promises state of the dispatcher
     * @return {Promise}
     */
    api.getDispatcher = () => {
        return $q.all(dispatcher);
    };

    api.empty = (mailbox) => {
        const labelID = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];

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
        return reverse(conversations.sort((a, b) => {
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
        }));
    };

    function reverse(list = []) {
        return list.reduce((acc, item) => (acc.unshift(item), acc), []);
    }

    /**
     * Return a list of messages reordered by Time
     * @param {Array} messages
     * @return {Array} don't miss this array is reversed
     */
    api.orderMessage = (messages = [], doReverse = true) => {
        const list = messages
            .sort((a, b) => {
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
            const timeA = (type === 'message') ? a.Time : api.getTime(a.ID, loc);
            const timeB = (type === 'message') ? b.Time : api.getTime(b.ID, loc);

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
        if (context && !firstLoad.get() && cachePages.consecutive(page)) {
            const start = page * CONSTANTS.ELEMENTS_PER_PAGE;
            const end = start + CONSTANTS.ELEMENTS_PER_PAGE;
            let total;
            let number;
            const mailbox = tools.currentMailbox();
            let messages = _.chain(messagesCached)
                .filter(({ LabelIDs = [] }) => LabelIDs.indexOf(loc) !== -1)
                .map((message) => messageModel(message))
                .value();

            messages = api.orderMessage(messages);

            switch (mailbox) {
                case 'label':
                    total = cacheCounters.totalMessage($stateParams.label);
                    break;
                default:
                    total = cacheCounters.totalMessage(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            if (angular.isDefined(total)) {
                if (total === 0) {
                    number = 0;
                } else if ((total % CONSTANTS.ELEMENTS_PER_PAGE) === 0) {
                    number = CONSTANTS.ELEMENTS_PER_PAGE;
                } else if ((Math.ceil(total / CONSTANTS.ELEMENTS_PER_PAGE) - 1) === page) {
                    number = total % CONSTANTS.ELEMENTS_PER_PAGE;
                } else {
                    number = CONSTANTS.ELEMENTS_PER_PAGE;
                }

                cacheCounters.currentState(total);
                messages = messages.slice(start, end);

                // Supposed total equal to the total cache?
                if (messages.length === number) {
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
        if (context && !firstLoad.get() && cachePages.consecutive(page)) {
            const start = page * CONSTANTS.ELEMENTS_PER_PAGE;
            const end = start + CONSTANTS.ELEMENTS_PER_PAGE;
            let total;
            let number;
            const mailbox = tools.currentMailbox();
            let conversations = _.filter(conversationsCached, ({ Labels = [], ID }) => _.findWhere(Labels, { ID: loc }) && api.getTime(ID, loc));

            conversations = api.orderConversation(conversations, loc);

            switch (mailbox) {
                case 'label':
                    total = cacheCounters.totalConversation($stateParams.label);
                    break;
                default:
                    total = cacheCounters.totalConversation(CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]);
                    break;
            }

            if (angular.isDefined(total)) {
                if (total === 0) {
                    number = 0;
                } else if ((total % CONSTANTS.ELEMENTS_PER_PAGE) === 0) {
                    number = CONSTANTS.ELEMENTS_PER_PAGE;
                } else if ((Math.ceil(total / CONSTANTS.ELEMENTS_PER_PAGE) - 1) === page) {
                    number = total % CONSTANTS.ELEMENTS_PER_PAGE;
                } else {
                    number = CONSTANTS.ELEMENTS_PER_PAGE;
                }

                cacheCounters.currentState(total);
                conversations = conversations.slice(start, end);
                // Supposed total equal to the total cache?
                if (conversations.length === number) {
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
     */
    api.queryMessagesCached = (ConversationID = '') => {
        const list = api.orderMessage(_.where(messagesCached, { ConversationID }));
        return list.map(messageModel);
    };

    /**
     * Return conversation cached
     * @param {String} conversationId
     * @return {Object}
     */
    api.getConversationCached = (ID) => angular.copy(_.findWhere(conversationsCached, { ID }));

    /**
     * Return message cached
     * @param {String} messageId
     * @return {Object}
     */
    api.getMessageCached = (ID) => messageModel(_.findWhere(messagesCached, { ID }));

    /**
     * @param {String} conversationID
     * @return {Promise}
     */
    api.getConversation = (ID) => {
        const conversation = _.findWhere(conversationsCached, { ID }) || {};
        const messages = api.queryMessagesCached(ID); // messages are ordered by -Time

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
        const message = _.findWhere(messagesCached, { ID }) || {};

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
    api.createMessage = (event) => (updateMessage(event.Message), Promise.resolve());
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
        const current = _.findWhere(messagesCached, { ID: event.ID });

        // // We need to force the update if the update is coming from a Send (new message)
        // if (!isSend && (!current || (current && event.Message.Time === current.Time))) {
        //     return Promise.resolve();
        // }
        if (!current) {
            return Promise.resolve();
        }

        const message = _.extend({}, current, event.Message);

        // Manage labels
        message.LabelIDs = getLabelsId(current, event.Message);
        delete message.LabelIDsRemoved;
        delete message.LabelIDsAdded;

        return Promise.resolve(updateMessage(message, isSend));
    };

    /**
     * Update a conversation
     */
    api.updateFlagConversation = (event = {}) => {
        const current = _.findWhere(conversationsCached, { ID: event.ID });

        if (current && current.loaded) {
            updateConversation(event.Conversation);
            return Promise.resolve();
        }

        return getConversation(event.ID)
        .then((conversation) => {
            conversation.LabelIDsAdded = event.Conversation.LabelIDsAdded;
            conversation.LabelIDsRemoved = event.Conversation.LabelIDsRemoved;
            updateConversation(conversation);
            return;
        });
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

    function getLabels(old, { Labels = [], LabelIDsRemoved = [], LabelIDsAdded = [] }) {
        if (LabelIDsAdded.length || LabelIDsRemoved.length) {
            const toAdd = _.map(LabelIDsAdded, (ID) => ({ ID }));
            const filtered = _.filter(old.Labels, ({ ID }) => !_.contains(LabelIDsRemoved, ID));
            return _.uniq(filtered.concat(toAdd), ({ ID }) => ID);
        }

        if (Labels.length) {
            return _.map(Labels, (label) => {
                const oldLabel = _.findWhere(old.Labels || [], { ID: label.ID });

                if (oldLabel) {
                    return _.extend({}, oldLabel, label);
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
        _.chain(events)
            .filter((event) => event.Message)
            .map((event) => angular.copy(event.Message))
            .each((newMessage) => {
                const oldMessage = _.findWhere(messagesCached, { ID: newMessage.ID });
                if (oldMessage) {
                    newMessage.LabelIDs = getLabelsId(oldMessage, newMessage);
                    manageCounters(oldMessage, newMessage, 'message');
                }
            });
        _.chain(events)
            .filter((event) => event.Conversation)
            .map((event) => angular.copy(event.Conversation))
            .each((newConversation) => {
                const oldConversation = _.findWhere(conversationsCached, { ID: newConversation.ID });
                if (oldConversation) {
                    newConversation.Labels = getLabels(oldConversation, newConversation);
                    manageCounters(oldConversation, newConversation, 'conversation');
                }
            });

        cacheCounters.status();
    }

    /**
    * Manage the cache when a new event comes
    * @param {Array} events - Object managing interaction with messages and conversations stored
    * @param {Boolean} fromBackend - indicate if the events come from the back-end
    * @return {Promise}
    */
    api.events = (events = [], fromBackend = false, isSend) => {
        const promises = [];
        const messageIDs = [];
        const conversationIDs = [];

        if (fromBackend) {
            console.log('events from the back-end', events);
        } else {
            console.log('events from the front-end', events);
        }

        if (!fromBackend) {
            handleCounters(events);
        }

        _.chain(events)
        .filter((event) => event.Action === DELETE)
        .each((event) => {
            promises.push(api.delete(event));
            messageIDs.push(event.ID);
            conversationIDs.push(event.ID);
        });

        _.chain(events)
        .filter((event) => event.Message)
        .each((event) => {
            event.Message.ID = event.ID;
            messageIDs.push(event.ID);

            switch (event.Action) {
                case CREATE:
                    promises.push(api.createMessage(event));
                    break;
                case UPDATE_DRAFT:
                    promises.push(api.updateFlagMessage(event, isSend));
                    break;
                case UPDATE_FLAGS:
                    promises.push(api.updateFlagMessage(event, isSend));
                    break;
                default:
                    break;
            }
        });

        _.chain((events))
        .filter((event) => event.Conversation)
        .each((event) => {
            event.Conversation.ID = event.ID;
            conversationIDs.push(event.ID);

            switch (event.Action) {
                case CREATE:
                    promises.push(api.createConversation(event));
                    break;
                case UPDATE_DRAFT:
                    promises.push(api.updateDraftConversation(event));
                    break;
                case UPDATE_FLAGS:
                    promises.push(api.updateFlagConversation(event));
                    break;
                default:
                    break;
            }
        });

        return Promise.all(promises)
            .then(() => api.callRefresh(messageIDs, conversationIDs));
    };

    /**
     * Ask to the message list controller to refresh the messages
     * First with the cache
     * Second with the query call
     */
    api.callRefresh = (messageIDs = [], conversationIDs = []) => {
        dispatchElements('refresh');
        $rootScope.$emit('updatePageName');
        $rootScope.$emit('refreshConversation', conversationIDs);
        $rootScope.$emit('message.refresh', messageIDs);
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
        const now = moment().unix();
        const { list, removeList } = messagesCached
            .reduce((acc, message = {}) => {
                const { ExpirationTime } = message;
                const test = !(ExpirationTime !== 0 && ExpirationTime < now);
                const key = test ? 'list' : 'removeList';
                acc[key].push(message);
                return acc;
            }, { list: [], removeList: [] });

        messagesCached = list;
        (removeList.length) && $rootScope.$emit('message.expiration', removeList);
    }

    /**
     * Return previous ID of message specified
     * @param {String} elementID - can be a message ID or a conversation ID
     * @param {Integer} elementTime - UNIX timestamp of the current element
     * @param {String} action - 'next' or 'previous'
     * @param {String} type - 'conversation' or 'message'
     * @return {Promise}
     */
    api.more = (elementID, elementTime, action) => {

        const type = tools.getTypeList();
        const elementsCached = (type === 'conversation') ? conversationsCached : messagesCached;
        const loc = tools.currentLocation();

        const callApi = () => {
            const Label = loc;
            const request = { Label };

            if (action === 'next') {
                request.BeginID = elementID;
                request.Begin = elementTime;
            } else if (action === 'previous') {
                request.EndID = elementID;
                request.End = elementTime;
            }

            const promise = (type === 'conversation') ? queryConversations(request) : queryMessages(request);

            return promise.then((elements = []) => {
                if (elements.length) {
                    const index = (action === 'next') ? (elements.length - 1) : 0;
                    return elements[index];
                }

                throw new Error('No elements found');
            });
        };

        const elements = elementsCached.filter(({ LabelIDs = [] }) => LabelIDs.indexOf(loc) > -1);
        const elementsOrdered = api.orderElements(elements, type, true, loc);
        const currentElement = _.findWhere(elementsOrdered, { ID: elementID });

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

    return api;
});
