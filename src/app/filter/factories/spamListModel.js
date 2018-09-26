import _ from 'lodash';

import { MAILBOX_IDENTIFIERS } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';

const BLACKLIST_TYPE = +MAILBOX_IDENTIFIERS.spam;
const WHITELIST_TYPE = +MAILBOX_IDENTIFIERS.inbox;
const PAGE_SIZE = 100;

/* @ngInject */
function spamListModel(dispatchers, incomingModel) {
    let MAIN_CACHE = getDefault();

    const { dispatcher, on } = dispatchers(['filters']);
    const dispatch = (type, data = {}) => dispatcher.filters(type, data);
    const getType = (type) => (type === 'whitelist' ? WHITELIST_TYPE : BLACKLIST_TYPE);
    function getDefault() {
        return {
            MAP: Object.create(null),
            [BLACKLIST_TYPE]: { list: [], page: 0 },
            [WHITELIST_TYPE]: { list: [], page: 0 }
        };
    }

    const resetIndex = (type) => {
        if (type) {
            if (MAIN_CACHE[WHITELIST_TYPE].ending) {
                MAIN_CACHE[WHITELIST_TYPE].page = 0;
                MAIN_CACHE[WHITELIST_TYPE].ending = false;
            }

            if (MAIN_CACHE[BLACKLIST_TYPE].ending) {
                MAIN_CACHE[BLACKLIST_TYPE].page = 0;
                MAIN_CACHE[BLACKLIST_TYPE].ending = false;
            }

            return (MAIN_CACHE[type].page = 0);
        }
        MAIN_CACHE[WHITELIST_TYPE].page = 0;
        MAIN_CACHE[BLACKLIST_TYPE].page = 0;
        MAIN_CACHE[WHITELIST_TYPE].ending = false;
        MAIN_CACHE[BLACKLIST_TYPE].ending = false;
    };

    const list = (type) => {
        const CACHE = MAIN_CACHE[type];

        const extendPage = (value) => (CACHE.page += value);
        const setLoader = (value) => (CACHE.loading = value);

        /**
         * Load the List and keep a ref inside the cache
         * @param  {Object} params
         * @return {Array}        Promise:<Array>
         */
        const loadList = async (params) => {
            const list = await incomingModel.get(_.extend({ Location: type }, params));
            !CACHE.ending && (CACHE.list = list);
            return list;
        };

        /**
         * Get list of items based on
         *     - Current context (search or not)
         *     - Pagination (next call will get next items)
         * This function is also called each time the user switch an element from a list to an other list
         * @param  {String} type   Type of list (black|white)list
         * @return {Array}
         */
        const get = async () => {
            const pageFrom = CACHE.page; // Starts at 0

            // If we ask for content already saved in cache we return the list
            if (CACHE.list.length && CACHE.list.length >= (pageFrom + 2) * PAGE_SIZE) {
                CACHE.ending = CACHE.list.length < PAGE_SIZE && !CACHE.invalidate;
                delete CACHE.invalidate;
                return angular.copy(CACHE.list);
            }

            extendPage(1);
            setLoader(true);

            const list = await loadList({
                Location: type,
                Page: pageFrom,
                Keyword: MAIN_CACHE.query,
                PageSize: PAGE_SIZE
            });

            updateCache();
            setLoader(false);
            CACHE.ending = list.length < PAGE_SIZE && !CACHE.invalidate;
            delete CACHE.invalidate;
            return list;
        };

        /**
         * Add an item from the list by adding its ref to the cache
         * Update the search too if we need to
         * @param  {String} Email
         * @param  {String} Location Type of list
         * @return {void}
         */
        const add = async (Email) => {
            const item = await incomingModel.create({ Email, Location: type });
            CACHE.list.unshift(item);
            MAIN_CACHE.MAP[item.ID] = item;
            resetIndex(item.Location);
            refresh();
        };

        const isLoading = () => !!CACHE.loading;
        const isEnding = () => !!CACHE.ending;

        return { extendPage, setLoader, loadList, get, add, isLoading, isEnding };
    };

    /**
     * Update the cache MAP
     */
    function updateCache(reset) {
        reset && (MAIN_CACHE.MAP = Object.create(null));
        const map = MAIN_CACHE[BLACKLIST_TYPE].list
            .concat(MAIN_CACHE[WHITELIST_TYPE].list)
            .reduce((acc, item) => ((acc[item.ID] = item), acc), Object.create(null));
        _.extend(MAIN_CACHE.MAP, map);
    }

    /**
     * Load Incoming filters and format a CACHE object by type
     * via references and a map.
     * @return {void}
     */
    async function load(params = {}, noEvent) {
        const config = { Page: 0, PageSize: PAGE_SIZE };
        const whitelist = list(WHITELIST_TYPE);
        const blacklist = list(BLACKLIST_TYPE);

        whitelist.setLoader(true);
        blacklist.setLoader(true);

        await Promise.all([
            whitelist.loadList(_.extend({}, config, params)),
            blacklist.loadList(_.extend({}, config, params))
        ]);

        whitelist.setLoader(false);
        blacklist.setLoader(false);
        updateCache();
        !noEvent && resetIndex();
        !noEvent && dispatch('change', { type: 'load' });
    }

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
            const item = MAIN_CACHE.MAP[id];
            const index = _.findIndex(MAIN_CACHE[item.Location].list, (o) => o.ID === item.ID);
            MAIN_CACHE[item.Location].list.splice(index, 1);
            MAIN_CACHE[location].list.unshift(data);
            MAIN_CACHE.MAP[item.ID] = data;
            MAIN_CACHE[item.Location].invalidate = !MAIN_CACHE[item.Location].ending;
            resetIndex();
            refresh();
        } catch (e) {
            const { data = {} } = e;
            // Trying to move an item already deleted -> refresh the list
            if (data.Code === API_CUSTOM_ERROR_CODES.INCOMING_DEFAULT_UPDATE_NOT_EXIST) {
                delete MAIN_CACHE.MAP[id];
                load({ Search: MAIN_CACHE.query });
            }
            throw e;
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
        const item = MAIN_CACHE.MAP[id];
        const index = _.findIndex(MAIN_CACHE[item.Location].list, (o) => o.ID === item.ID);
        MAIN_CACHE[item.Location].list.splice(index, 1);
        MAIN_CACHE[item.Location].invalidate = !MAIN_CACHE[item.Location].ending;
        delete MAIN_CACHE.MAP[id];
        resetIndex(item.Location);
        refresh();
    };

    /**
     * Perform the search and reset previous index
     * @param  {String} query
     * @return {void}
     */
    async function search(query) {
        MAIN_CACHE.query = query;
        resetIndex();
        await load({ Keyword: query }, true);
        dispatch('search');
    }

    /**
     * Refresh the UI
     */
    function refresh() {
        if (MAIN_CACHE.query) {
            return search(MAIN_CACHE.query);
        }

        dispatch('change', { type: 'refresh' });
    }

    const clear = () => (MAIN_CACHE = getDefault());

    on('logout', () => {
        clear();
    });

    return { list, load, move, destroy, search, refresh, clear, getType };
}
export default spamListModel;
