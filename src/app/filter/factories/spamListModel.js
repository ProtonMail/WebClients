angular.module('proton.filter')
    .factory('spamListModel', ($q, $rootScope, CONSTANTS, incomingModel) => {

        const { MAILBOX_IDENTIFIERS } = CONSTANTS;
        const BLACKLIST_TYPE = +MAILBOX_IDENTIFIERS.spam;
        const WHITELIST_TYPE = +MAILBOX_IDENTIFIERS.inbox;
        const PAGE_SIZE = 100;
        let CACHE = getDefault();

        const dispatch = (type, data = {}) => $rootScope.$emit('filters', { type, data });
        const getType = (type) => (type === 'whitelist' ? WHITELIST_TYPE : BLACKLIST_TYPE);

        function getDefault() {
            return {
                MAP: Object.create(null),
                [`${BLACKLIST_TYPE}_TO`]: 0,
                [`${WHITELIST_TYPE}_TO`]: 0,
                [BLACKLIST_TYPE]: [],
                [WHITELIST_TYPE]: []
            };
        }

        const getKey = (type, suffix) => `${type}.${suffix}`;
        const getIndex = (type) => getKey(type, 'TO');
        const getEndingKey = (type) => getKey(type, 'ending');
        const extendIndex = (type, value) => CACHE[getIndex(type)] += value;
        const setLoader = (type, value) => (CACHE[getKey(type, 'loading')] = value);

        const resetIndex = (type) => {
            if (type) {
                if (CACHE[getEndingKey(WHITELIST_TYPE)]) {
                    CACHE[getIndex(WHITELIST_TYPE)] = 0;
                    CACHE[getEndingKey(WHITELIST_TYPE)] = false;
                }

                if (CACHE[getEndingKey(BLACKLIST_TYPE)]) {
                    CACHE[getIndex(BLACKLIST_TYPE)] = 0;
                    CACHE[getEndingKey(BLACKLIST_TYPE)] = false;
                }

                return (CACHE[getIndex(type)] = 0);
            }
            CACHE[getIndex(WHITELIST_TYPE)] = 0;
            CACHE[getIndex(BLACKLIST_TYPE)] = 0;
            CACHE[getEndingKey(WHITELIST_TYPE)] = false;
            CACHE[getEndingKey(BLACKLIST_TYPE)] = false;
        };

        /**
         * Load the List and keep a ref inside the cache
         * @param  {Object} params
         * @return {Array}        Promise:<Array>
         */
        const loadList = async (params) => {
            const list = await incomingModel.get(params);
            !CACHE[getEndingKey(params.Location)] && (CACHE[params.Location] = list);
            return list;
        };

        /**
         * Update the cache MAP
         */
        const updateCache = (reset) => {
            reset && (CACHE.MAP = Object.create(null));

            const map = CACHE[BLACKLIST_TYPE].concat(CACHE[WHITELIST_TYPE])
                .reduce((acc, item) => (acc[item.ID] = item, acc), Object.create(null));
            _.extend(CACHE.MAP, map);
        };

        /**
         * Load Incoming filters and format a CACHE object by type
         * via references and a map.
         * @return {void}
         */
        const load = async (params = {}, noEvent) => {
            const config = { Start: 0, Amount: PAGE_SIZE };

            setLoader(WHITELIST_TYPE, true);
            setLoader(BLACKLIST_TYPE, true);

            await Promise.all([
                loadList(_.extend({ Location: BLACKLIST_TYPE }, config, params)),
                loadList(_.extend({ Location: WHITELIST_TYPE }, config, params))
            ]);

            setLoader(WHITELIST_TYPE, false);
            setLoader(BLACKLIST_TYPE, false);
            updateCache();
            !noEvent && resetIndex();
            !noEvent && dispatch('change', { type: 'load' });
        };

        /**
         * Get list of items based on
         *     - Current context (search or not)
         *     - Pagination (next call will get next items)
         * @todo  Use a Promise as output to be able to load data from the API instead of the cache
         * @param  {String} type   Type of list (black|white)list
         * @param  {Integer} length Size of the list you want to load
         * @return {Array}
         */
        const getList = async (type = WHITELIST_TYPE, length = PAGE_SIZE) => {
            const indexFrom = CACHE[getIndex(type)];
            extendIndex(type, length);
            setLoader(type, true);

            if (indexFrom === 0) {
                setLoader(type, false);
                CACHE[getEndingKey(type)] = CACHE[type].length < PAGE_SIZE;
                return angular.copy(CACHE[type]);
            }

            const list = await loadList({
                Location: type,
                Start: indexFrom,
                Search: CACHE.query,
                Amount: length
            });

            updateCache();
            setLoader(type, false);
            CACHE[getEndingKey(type)] = list.length < PAGE_SIZE;
            return list;
        };

        /**
         * Perform the search and reset previous index
         * @param  {String} query
         * @return {void}
         */
        const search = async (query) => {
            CACHE.query = query;
            resetIndex();
            await load({ Search: query }, true);
            dispatch('search');
        };

        /**
         * Move an item from a list to another and update its ref inside the map
         * If search context, we update the search to match the new item
         * @param  {String} id   Id of the email to move
         * @param  {String} location Type of list
         * @return {void}
         */
        const move = async (id, location) => {
            try {
                const data = await incomingModel.update(id, location);
                const item = CACHE.MAP[id];
                const index = _.findIndex(CACHE[item.Location], (o) => o.ID === item.ID);
                CACHE[item.Location].splice(index, 1);
                CACHE[location].unshift(data);
                CACHE.MAP[item.ID] = data;
                resetIndex();
                refresh();
            } catch (e) {
                // Trying to move an item already deleted -> refresh the list
                if (e.Code === 35023) {
                    delete CACHE.MAP[id];
                    load({ Search: CACHE.query });
                }
            }
        };

        /**
         * Remove an tem from the list and remove its reference from the cache
         * Update the search too if we need to
         * @param  {String} id Email item id
         * @return {void}
         */
        const destroy = async (id) => {
            await incomingModel.remove(id);
            const item = CACHE.MAP[id];
            const index = _.findIndex(CACHE[item.Location], (o) => o.ID === item.ID);
            CACHE[item.Location].splice(index, 1);
            delete CACHE.MAP[id];
            resetIndex(item.Location);
            refresh();
        };

        /**
         * Add an item from the list by adding its ref to the cache
         * Update the search too if we need to
         * @param  {String} Email
         * @param  {String} Location Type of list
         * @return {void}
         */
        const add = async (Email, location) => {
            const item = await incomingModel.create({ Email, Location: location });
            CACHE[item.Location].unshift(item);
            CACHE.MAP[item.ID] = item;
            resetIndex(item.Location);
            refresh();
        };

        /**
         * Refresh the UI
         */
        function refresh() {
            if (CACHE.query) {
                return search(CACHE.query);
            }
            dispatch('change', { type: 'refresh' });
        }

        const isLoading = (type) => !!CACHE[getKey(type, 'loading')];
        const isEnding = (type) => !!CACHE[getEndingKey(type)];
        const clear = () => (CACHE = getDefault());

        return {
            load, search, getList, move, destroy, add,
            isLoading, isEnding, getType, clear
        };

    });
