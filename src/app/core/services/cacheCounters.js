angular.module('proton.core')
    .service('cacheCounters', (Message, CONSTANTS, Conversation, $q, $rootScope, authentication) => {
        const api = {};
        let counters = {};
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

        /**
        * Query unread and total
        * Find the total and unread items per message and conversation
        * @return {Promise}
        */
        api.query = () => {
            const idsLabel = _.map(authentication.user.Labels, ({ ID }) => ID) || [];
            const locs = ['0', '1', '2', '3', '4', '6', '10'].concat(idsLabel);

            return $q.all({
                message: Message.count().$promise,
                conversation: Conversation.count()
            })
            .then(({ message = {}, conversation = {} } = {}) => {
                // Initialize locations
                locs.forEach(exist);

                _.chain(message.Counts)
                    .filter(({ LabelID }) => counters[LabelID])
                    .each(({ LabelID, Total = 0, Unread = 0 }) => {
                        counters[LabelID].message.total = Total;
                        counters[LabelID].message.unread = Unread;
                    });

                _.chain(conversation.data.Counts)
                    .filter(({ LabelID }) => counters[LabelID])
                    .each(({ LabelID, Total = 0, Unread = 0 }) => {
                        counters[LabelID].conversation.total = Total;
                        counters[LabelID].conversation.unread = Unread;
                    });
                return Promise.resolve();
            }, Promise.reject);
        };

        /**
         * Add a new location
         * @param {String} loc
         */
        api.add = (loc = '') => {
            exist(loc);
        };

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

        return api;
    });
