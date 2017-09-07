angular.module('proton.filter')
    .factory('spamListModel', ($q, $rootScope, CONSTANTS, incomingModel) => {

        const { MAILBOX_IDENTIFIERS } = CONSTANTS;
        const BLACKLIST_TYPE = +MAILBOX_IDENTIFIERS.spam;
        const WHITELIST_TYPE = +MAILBOX_IDENTIFIERS.inbox;
        const PAGE_SIZE = 100;

        const CACHE = {
            [`${BLACKLIST_TYPE}_TO`]: 0,
            [`${WHITELIST_TYPE}_TO`]: 0,
            [BLACKLIST_TYPE]: [],
            [WHITELIST_TYPE]: []
        };

        const getTypeID = (type) => (type === 'whitelist' ? WHITELIST_TYPE : BLACKLIST_TYPE);
        const dispatch = (type, data = {}) => $rootScope.$emit('filters', { type, data });

        const getIndex = (type) => `${getTypeID(type)}_TO`;
        const extendIndex = (type, value) => CACHE[`${getTypeID(type)}_TO`] += value;
        const resetIndex = (type) => {
            if (type) {
                return (CACHE[type || getIndex(type)] = 0);
            }
            CACHE[getIndex('whitelist')] = 0;
            CACHE[getIndex('blacklistl')] = 0;
        };

        /**
         * Load the List and keep a ref inside the cache
         * @param  {Object} params
         * @return {Array}        Promise:<Array>
         */
        const loadList = async (params) => {
            const list = await incomingModel.get(params);
            CACHE[params.Location] = list;
            return list;
        };

        /**
         * Update the cache MAP
         */
        const updateCache = () => {
            CACHE.MAP = CACHE[BLACKLIST_TYPE].concat(CACHE[WHITELIST_TYPE])
                .reduce((acc, item) => (acc[item.ID] = item, acc), Object.create(null));
        };

        /**
         * Load Incoming filters and format a CACHE object by type
         * via references and a map.
         * @return {void}
         */
        const load = async (params = {}, noEvent) => {
            CACHE.isLoading = true;
            const config = { Start: 0, Amount: PAGE_SIZE };
            await Promise.all([
                loadList(_.extend({ Location: BLACKLIST_TYPE }, config, params)),
                loadList(_.extend({ Location: WHITELIST_TYPE }, config, params))
            ]);

            CACHE.isLoading = false;
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
        const getList = async (type = 'whitelist', length = PAGE_SIZE) => {
            const indexFrom = CACHE[getIndex(type)];
            extendIndex(type, length);
            CACHE.isLoading = true;

            if (indexFrom === 0) {
                CACHE.isLoading = false;
                return angular.copy(CACHE[getTypeID(type)]);
            }

            const list = await loadList({
                Location: getTypeID(type),
                Start: indexFrom,
                Search: CACHE.query,
                Amount: length
            });

            updateCache();
            CACHE.isLoading = false;
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
         * @param  {String} type Type of list
         * @return {void}
         */
        const move = async (id, type) => {
            const location = getTypeID(type);
            const data = await incomingModel.update(id, location);
            const item = CACHE.MAP[id];
            const index = _.findIndex(CACHE[item.Location], (o) => o.ID === item.ID);
            CACHE[item.Location].splice(index, 1);
            CACHE[location].unshift(data);
            CACHE.MAP[item.ID] = data;
            resetIndex();
            refresh();
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
         * @param  {String} type Type of list
         * @return {void}
         */
        const add = async (Email, type) => {
            const item = await incomingModel.create({ Email, Location: getTypeID(type) });
            CACHE[item.Location].unshift(item.IncomingDefault);
            CACHE.MAP[item.ID] = item.IncomingDefault;
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

        const isLoading = () => !!CACHE.isLoading;

        return { load, search, getList, move, destroy, isLoading, add };

    });
