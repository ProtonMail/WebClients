import { flow, each, filter } from 'lodash/fp';

/* @ngInject */
function cacheCounters(messageApi, CONSTANTS, conversationApi, $q, dispatchers, authentication, labelsModel) {
    const api = {};
    let counters = {};
    const { dispatcher, on } = dispatchers(['app.cacheCounters']);
    const { inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred } = CONSTANTS.MAILBOX_IDENTIFIERS;
    const dispatch = (type, data = {}) => dispatcher['app.cacheCounters'](type, data);

    const exist = (loc) => {
        if (angular.isUndefined(counters[loc])) {
            counters[loc] = {
                message: {
                    total: 0,
                    unread: 0
                },
                conversation: {
                    total: 0,
                    unread: 0
                }
            };
        }
    };

    on('labelsModel', (e, { type, data }) => {
        if (type === 'cache.update') {
            data.create.forEach(({ ID }) => exist(ID));
            Object.keys(data.remove).forEach((ID) => {
                delete counters[ID];
            });
        }
    });

    /**
     * Query unread and total
     * Find the total and unread items per message and conversation
     * @return {Promise}
     */
    api.query = () => {
        const locs = [inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred].concat(labelsModel.ids());

        return $q
            .all({
                message: messageApi.count(),
                conversation: conversationApi.count()
            })
            .then(({ message = {}, conversation = {} } = {}) => {
                // Initialize locations
                locs.forEach(exist);

                flow(
                    filter(({ LabelID }) => counters[LabelID]),
                    each(({ LabelID, Total = 0, Unread = 0 }) => {
                        counters[LabelID].message.total = Total;
                        counters[LabelID].message.unread = Unread;
                    })
                )(message.data.Counts);

                flow(
                    filter(({ LabelID }) => counters[LabelID]),
                    each(({ LabelID, Total = 0, Unread = 0 }) => {
                        counters[LabelID].conversation.total = Total;
                        counters[LabelID].conversation.unread = Unread;
                    })
                )(conversation.data.Counts);

                dispatch('load');

                return Promise.resolve();
            }, Promise.reject);
    };

    /**
     * Add a new location
     * @param {String} loc
     */
    api.add = (loc = '') => exist(loc);

    api.status = () => dispatch('update.counters', { counters });

    /**
     * Update the total / unread for a specific loc
     * @param {String} loc
     * @param {Integer} total
     * @param {Integer} unread
     */
    api.updateMessage = (loc = '', total, unread) => {
        exist(loc);
        if (angular.isDefined(total)) {
            counters[loc].message.total = total;
        }
        if (angular.isDefined(unread)) {
            counters[loc].message.unread = unread;
        }
    };

    /**
     * Update the total / unread for a specific loc
     * @param {String} loc
     * @param {Integer} total
     * @param {Integer} unread
     */
    api.updateConversation = (loc = '', total, unread) => {
        exist(loc);
        if (angular.isDefined(total)) {
            counters[loc].conversation.total = total;
        }
        if (angular.isDefined(unread)) {
            counters[loc].conversation.unread = unread;
        }
    };

    /**
     * Get the total of messages for a specific loc
     * @param {String} loc
     */
    api.totalMessage = (loc = '') => {
        return counters[loc] && counters[loc].message && counters[loc].message.total;
    };

    /**
     * Get the total of conversation for a specific loc
     * @param {String} loc
     */
    api.totalConversation = (loc = '') => {
        return counters[loc] && counters[loc].conversation && counters[loc].conversation.total;
    };

    /**
     * Get the number of unread messages for the specific loc
     * @param {String} loc
     */
    api.unreadMessage = (loc = '') => {
        return counters[loc] && counters[loc].message && counters[loc].message.unread;
    };

    /**
     * Get the number of unread conversation for the specific loc
     * @param {String} loc
     */
    api.unreadConversation = (loc = '') => {
        return counters[loc] && counters[loc].conversation && counters[loc].conversation.unread;
    };

    api.reset = () => {
        counters = {};
    };

    api.currentState = (value = 0) => {
        counters.CURRENT_STATE_VALUE = value;
        dispatch('refresh.currentState', { value });
    };

    api.getCurrentState = () => counters.CURRENT_STATE_VALUE || 0;
    api.getCounter = (location) => counters[location];

    return api;
}
export default cacheCounters;
