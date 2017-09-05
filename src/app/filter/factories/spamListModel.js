angular.module('proton.filter')
    .factory('spamListModel', ($q, $rootScope, CONSTANTS, notify, gettextCatalog, IncomingDefault) => {

        const dispatch = (type, data) => $rootScope.$emit('filter', { type, data });

        const PAGE_SIZE = 250;

        const EMAIL_LISTS = {
        };

        const getEventData = (type) => {
            return { name: EMAIL_LISTS[type].name, entries: EMAIL_LISTS[type].entries };
        };

        const triggerUpdateList = (type) => dispatch('spamlist.update', getEventData(type));

        const deleteEntry = async (id) => {

            const { data = {} } = await IncomingDefault.delete({ IDs: [id] });

            if (data.Error) {
                notify({ message: data.Error, classes: 'notification-danger' });
                throw new Error(data.Error);
            }

            notify({
                message: gettextCatalog.getString('Spam Filter Deleted', null, 'Incoming Defaults'),
                classes: 'notification-success'
            });

            // Matching types
            const types = _.keys(EMAIL_LISTS).filter((type) => _.findWhere(EMAIL_LISTS[type], { ID: id }));

            // This works as of https://github.com/jashkenas/underscore/pull/1582
            _.each(EMAIL_LISTS, (list) => list.entries = _.reject(list, { ID: id }));

            _.each(types, triggerUpdateList);
        };

        const getList = (type) => {
            return EMAIL_LISTS[type].object;
        };

        const constructList = (type, location) => {

            const listData = {
                name: type,
                q: null,
                entries: [],
                nextElement: null,
                endReached: false,
                isFetchingData: false,
                object: {},
                location,
                cache: null
            };

            const matchesQuery = ({ Email }) => listData.q === null || Email.includes(listData.q);

            function sleep(ms) {
                return new Promise((resolve) => setTimeout(resolve, ms));
            }

            const fetchEntries = async (start, amountRequested) => {
                if (listData.cache) {
                    try {
                        listData.isFetchingData = true;
                        await sleep(200);
                        const data = Object.assign({}, listData.cache);
                        data.IncomingDefaults = data.IncomingDefaults.slice(start, start + amountRequested);
                        return data;
                    } finally {
                        listData.isFetchingData = false;
                    }
                }
                try {
                    listData.isFetchingData = true;
                    const { data = {} } = await IncomingDefault.get();
                    if (!data.Error) {
                        // this will be done on the back end
                        const baseList = _.sortBy(_.where(data.IncomingDefaults, { Location: listData.location }), 'Time').reverse();
                        const filteredList = baseList.filter(matchesQuery);
                        listData.cache = Object.assign({}, data, { IncomingDefaults: filteredList });
                        // end things that should be done on the back end

                        // retrieve from cache
                        const newdata = Object.assign({}, listData.cache);
                        newdata.IncomingDefaults = newdata.IncomingDefaults.slice(start, start + amountRequested);
                        return newdata;
                    }

                    return data;
                } finally {
                    listData.isFetchingData = false;
                }
            };

            const ensureList = async (search, amount) => {

                if (listData.q !== search) {
                    Object.assign(listData, { q: search, entries: [], endReached: false });
                }

                if (listData.entries.length > amount || listData.endReached) {
                    return;
                }

                const start = listData.entries.length;
                const amountNeeded = amount - listData.entries.length;
                /*
                 Always request one extra, which we discard: if this one is present we know that there is more than amount
                 We discard it so you don't scroll down, load and then don't load anything extra
                 */
                const amountRequested = amountNeeded + 1;

                const data = await fetchEntries(start, amountRequested);

                if (data.Error) {
                    throw new Error(data.Error || 'Error in filterModal.getList');
                }

                const list = data.IncomingDefaults;

                listData.endReached = list.length !== amountRequested;
                listData.nextElement = list[amountRequested - 1] || null;

                listData.entries = listData.entries.concat(list.slice(0, amountNeeded));
            };

            const hasMoreData = () => {
                return !listData.endReached;
            };

            const isFetchingData = () => {
                return listData.isFetchingData;
            };

            const fetchMoreData = async () => {
                await ensureList(listData.q, listData.entries.length + PAGE_SIZE);

                triggerUpdateList(type);
                return angular.copy(listData.entries);
            };

            const search = async (search) => {
                await ensureList(search, PAGE_SIZE);

                triggerUpdateList(type);
                return angular.copy(listData.entries);
            };

            const reload = async () => {
                // discard all data:
                Object.assign(listData, { q: null, entries: [], endReached: false });

                // load data
                await ensureList(null, PAGE_SIZE);

                triggerUpdateList(type);
                return angular.copy(listData.entries);
            };

            const getEntries = () => {
                return angular.copy(listData.entries);
            };

            const add = async (email) => {

                const { data = {} } = await IncomingDefault.add({
                    Email: email,
                    Location: location
                });

                if (data.Error) {
                    notify({ message: data.Error, classes: 'notification-danger' });
                    throw new Error(data.Error);
                }

                notify({
                    message: gettextCatalog.getString('Spam Filter Added'),
                    classes: 'notification-success'
                });

                // Emails are always added the start of the email list
                if (matchesQuery(data.IncomingDefault)) {
                    listData.entries.unshift(data.IncomingDefault);
                    return data.IncomingDefault;
                }

                triggerUpdateList(type);
                return data.IncomingDefault;
            };

            /*
             * Updates the internal lists, such that the list in the same state as the BE after switching the designated
             * list entry
             */
            const adoptInternal = (entry) => {

                // First remove the filter everywhere
                _.each(EMAIL_LISTS, (list) => list.entries = _.reject(list.entries, { ID: entry.ID }));

                // check if we can actually place in it in the right order, or it falls outside of the list
                if (listData.nextElement !== null && listData.nextElement.Time > entry.Time) {
                    // it falls below the next element: ignore.
                    return;
                }

                if (listData.entries.length === 0) {
                    listData.entries.push(entry);
                    return;
                }

                const closestBy = _.sortBy(listData.entries, (entry) => Math.abs(entry.Time - entry.Time));

                const closestEntry = closestBy[0];
                const index = _.indexOf(listData.entries, closestEntry);

                // insert after if the entry is before the actual filter
                listData.entries.splice(index + (closestEntry.Time > entry.Time ? 1 : 0), 0, entry);
            };

            const adopt = async (id) => {

                // Matching types
                const types = _.keys(EMAIL_LISTS).filter((type) => _.findWhere(EMAIL_LISTS[type].entries, { ID: id }));
                types.push(type);

                const { data = {} } = await IncomingDefault.update({
                    ID: id,
                    Location: EMAIL_LISTS[type].location
                });

                if (data.Error) {
                    notify({ message: data.Error, classes: 'notification-danger' });
                    throw new Error(data.Error);
                }

                notify({
                    message: gettextCatalog.getString('Spam Filter Updated', null, 'Incoming Defaults'),
                    classes: 'notification-success'
                });

                // Update our own data
                const entry = data.IncomingDefault;

                // We need to update our internally state without re-requesting the complete list
                adoptInternal(entry);

                // trigger the required events
                _.each(types, triggerUpdateList);

                return entry;
            };


            Object.assign(listData.object, {
                reload, getEntries, add,
                adopt, fetchMoreData, hasMoreData,
                isFetchingData, search, matchesQuery
            });

            return listData;
        };

        Object.assign(EMAIL_LISTS, {
            blacklist: constructList('blacklist', Number(CONSTANTS.MAILBOX_IDENTIFIERS.spam)),
            whitelist: constructList('whitelist', Number(CONSTANTS.MAILBOX_IDENTIFIERS.inbox))
        });

        return { init: angular.noop, getList, deleteEntry };
    });
