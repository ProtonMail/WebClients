angular.module('proton.filter')
    .factory('filterModel', ($q, $rootScope, IncomingDefault, constants, Filter) => {

        const dispatch = (type, data) => $rootScope.$emit('filter', { type, data });

        const DEFAULT_LIST_SIZE = 100;

        const cache = {
            emailLists: {
                blacklist: {
                    name: 'blacklist',
                    q: null,
                    list: [],
                    nextElement: null,
                    endReached: false,
                    location: constants.MAILBOX_IDENTIFIERS.spam
                },
                whitelist: {
                    name: 'whitelist',
                    q: null,
                    list: [],
                    nextElement: null,
                    endReached: false,
                    location: constants.MAILBOX_IDENTIFIERS.inbox
                }
            },
            customFilters: null
        };

        const matchesQuery = (type, { Email }) => cache.emailLists[type].q === null || Email.includes(cache.emailLists[type].q);

        const ensureList = async (type, search, amount) => {
            const listData = cache.emailLists[type];

            if (listData.q !== search) {
                Object.assign(listData, { q: search, list: [], endReached: false });
            }

            if (listData.list.length > amount || listData.endReached) {
                return;
            }

            const start = listData.length;
            const amountNeeded = amount - listData.length;
            /*
             Always request one extra, which we discard: if this one is present we know that there is more than amount
             We discard it so you don't scroll down, load and then don't load anything extra
             */
            const amountRequested = amountNeeded + 1;

            const { data = {} } = await IncomingDefault.get();

            if (data.Code !== 1000) {
                throw new Error(data.Code || 'Error in filterModal.getList');
            }

            // this will be done on the back end
            const baseList = _.where(data.IncomingDefaults, { Location: listData.location });
            const filteredList = baseList.filter(matchesQuery.bind(null, type));
            const list = filteredList.slice(start);
            // end things that should be done on the back end

            listData.endReached = list.length !== amountRequested;
            listData.nextElement = list[amountRequested - 1] || null;

            listData.list = listData.concat(list.slice(0, amountNeeded));
        };

        const getList = async (type, search, amount) => {
            await ensureList(type, search, amount);

            const listData = cache.emailLists[type];
            const result = angular.copy(listData);

            dispatch('update.emaillist', result);
            return result.list;
        };

        // true false or don't know (null)
        const listLengthGreaterThan = (type, search, amount) => {
            const listData = cache.emailLists[type];

            if (listData.q !== search || (listData.length > amount && !listData.endReached)) {
                return null;
            }
            return listData.length > amount || (listData.length === amount && !listData.endReached);
        };

        const getCustomFilters = async () => {
            if (cache.customFilters === null) {
                return cache.customFilters;
            }

            const { data = {} } = Filter.query();

            if (data.Code !== 1000) {
                throw new Error(data.Error);
            }

            return data.Filters;
        };

        const loadCache = (search) => {
            return $q.all([
                getList('blacklist', search, DEFAULT_LIST_SIZE),
                getList('whitelist', search, DEFAULT_LIST_SIZE),
                getCustomFilters()
            ]);
        };

        const deleteFromEmailList = async (id) => {

            const { data = {} } = await IncomingDefault.delete({ IDs: [ id ] });

            if (data.Error) {
                throw new Error(data.Error);
            }

            // Matching types
            const types = _.findKeys(cache.emailLists, (type) => _.findWhere(cache.emailLists[type], { ID: id }));

            // This works as of https://github.com/jashkenas/underscore/pull/1582
            cache.emailLists = _.mapObject(cache.emailLists, (list) => _.reject(list, { ID: id }));

            _.each(types, (type) => dispatch('update.emaillist', angular.copy(cache.emailLists[type])));
        };

        const changeListType = async (id, newType) => {

            const types = _.findKeys(cache.emailLists, (type) => _.findWhere(cache.emailLists[type], { ID: id }));
            types.push(newType);

            const { data = {} } = await IncomingDefault.update({ ID: id, Location: cache.emailLists[newType].location });

            if (data.Error) {
                throw new Error(data.Error);
            }
            // Update our own data
            const filter = data.IncomingDefault;

            // First remove everywhere
            cache.emailLists = _.mapObject(cache.emailLists, (list) => _.reject(list, { ID: id }));
            // check if we can actually place in it in the right order, or it falls outside of the list

            const listData = cache.emailLists[newType];

            if (listData.nextElement !== null && listData.nextElement.Time > filter.Time) {
                // it falls below the next element: ignore.
                return;
            }

            const closestBy = _.sortBy(listData.list, (entry) => Math.abs(entry.Time - data.IncomingDefault.Time));

            const closestEntry = closestBy[0];
            const index = _.indexOf(listData.list, closestEntry);

            // insert after if the entry is before the actual filter
            listData.list.splice(index + (closestEntry.Time > filter.Time ? 1 : 0), 0, filter);

            // trigger the required events
            _.each(types, (type) => dispatch('update.emaillist', angular.copy(cache.emailLists[type])));
        };

        const addToEmailList = async (type, email) => {
            const { data = {} } = await IncomingDefault.add({ Email: email, Location: cache.emailLists[type].location });
            if (data.Error) {
                throw new Error(data.Error);
            }

            // Emails are always added the start of the email list
            if (matchesQuery(type, data.IncomingDefault)) {
                cache.emailLists[type].list.unshift(data.IncomingDefault);
            }

            dispatch('update.emaillist', angular.copy(cache.emailLists[type]));
            return data;
        };

        return { init: angular.noop, loadCache, getCustomFilters, getList,
            listLengthGreaterThan, deleteFromEmailList,
            changeListType, addToEmailList };
    });
