angular.module('proton.filter')
    .factory('spamListModel', ($q, $rootScope, CONSTANTS, notify, gettextCatalog, IncomingDefault, filterLanguage) => {

        const dispatch = (type, data) => $rootScope.$emit('filter', { type, data });

        const PAGE_SIZE = 100;

        const EMAIL_LISTS = { };

        const triggerUpdateList = (type) => dispatch('spamlist.update',
            {
                name: EMAIL_LISTS[type].name,
                entries: angular.copy(EMAIL_LISTS[type].entries)
            });

        const triggerAppendList = (type, appended) => dispatch('spamlist.update',
            {
                name: EMAIL_LISTS[type].name,
                entries: angular.copy(EMAIL_LISTS[type].entries),
                appended: angular.copy(appended)
            });

        const requestAndNotify = (request, successMessage) => request.then((result) => {
            const { data } = result;
            if (data.Error) {
                notify({ message: data.Error, classes: 'notification-danger' });
                throw new Error(data.Error);
            }

            notify({ message: successMessage, classes: 'notification-success' });

            return result;
        });

        // returns the modified lists
        const deleteInternal = (id) => {
            const result = _.keys(EMAIL_LISTS).filter((type) => _.findWhere(EMAIL_LISTS[type].entries, { ID: id }));
            // This works as of https://github.com/jashkenas/underscore/pull/1582
            _.each(EMAIL_LISTS, (list) => list.entries = _.reject(list.entries, { ID: id }));
            return result;
        };

        const deleteEntry = async (id) => {

            await requestAndNotify(IncomingDefault.delete({ IDs: [id] }),
                gettextCatalog.getString('Spam Filter Deleted', null, 'Incoming Defaults'));

            // Matching types
            const modifiedLists = deleteInternal(id);

            _.each(modifiedLists, triggerUpdateList);
        };

        const constructList = (type, location) => {

            const listData = {
                name: type,
                q: null,
                entries: [],
                nextElement: null,
                endReached: false,
                isFetchingData: false,
                object: {}
            };

            const matchesQuery = ({ Email }) => listData.q === null || Email.includes(listData.q);

            const fetchEntries = async (start, amountRequested) => {
                try {
                    listData.isFetchingData = true;

                    const { data = {} } = await IncomingDefault.get();

                    if (!data.Error) {
                        // This will be done on the back end
                        const baseList = _.sortBy(_.where(data.IncomingDefaults, { Location: location }), 'Time').reverse();
                        const filteredList = baseList.filter(matchesQuery);
                        // End things that should be done on the back end
                        data.IncomingDefaults = filteredList.slice(start, start + amountRequested);
                        return data;
                    }

                    return data;
                } finally {
                    listData.isFetchingData = false;
                }
            };

            const ensureList = async (search, amount) => {

                const isAppend = listData.q === search;
                if (!isAppend) {
                    Object.assign(listData, { q: search, entries: [], endReached: false });
                }

                if (listData.entries.length > amount || listData.endReached) {
                    return [];
                }

                const start = listData.entries.length;
                const amountNeeded = amount - listData.entries.length;
                /*
                 * Always request one extra, which we discard: if this one is present we know that there is more than amount
                 * We discard it so you don't scroll down, load and then don't load anything extra
                 */
                const amountRequested = amountNeeded + 1;

                const data = await fetchEntries(start, amountRequested);

                if (data.Error) {
                    throw new Error(data.Error || 'Error in getEntries');
                }

                const list = data.IncomingDefaults;

                listData.endReached = list.length !== amountRequested;
                listData.nextElement = list[amountRequested - 1] || null;
                const appended = list.slice(0, amountNeeded);

                listData.entries.push(...appended);

                return appended;
            };

            const triggerAppend = _.partial(triggerAppendList, type);

            const triggerUpdate = _.partial(triggerUpdateList, type);

            const hasMoreData = () => !listData.endReached;

            const isFetchingData = () => listData.isFetchingData;

            const getEntries = () => angular.copy(listData.entries);

            const fetchMoreData = () => ensureList(listData.q, listData.entries.length + PAGE_SIZE).then(triggerAppend);

            const search = (search) => ensureList(search, PAGE_SIZE).then(triggerUpdate);

            const reload = () => {
                // discard all data:
                Object.assign(listData, { q: null, entries: [], endReached: false });

                // load data
                return ensureList(null, PAGE_SIZE).then(triggerUpdate);
            };


            const add = async (email) => {

                const request = IncomingDefault.add({ Email: email, Location: location });

                const { data = {} } = await requestAndNotify(request, filterLanguage.BLOCK_FILTER_ADDED);

                // Emails are always added the start of the email list
                if (matchesQuery(data.IncomingDefault)) {
                    listData.entries.unshift(data.IncomingDefault);
                }

                triggerUpdateList(type);
            };


            const adopt = async (id) => {

                // Find modified locations
                const types = _.keys(EMAIL_LISTS).filter((type) => _.findWhere(EMAIL_LISTS[type].entries, { ID: id }));
                types.push(type);

                const request = IncomingDefault.update({ ID: id, Location: location });

                const { data = {} } = await requestAndNotify(request, filterLanguage.BLOCK_FILTER_UPDATED);

                // We need to update our internally state without re-requesting the complete list
                const entry = data.IncomingDefault;

                const modifiedLists = deleteInternal(id);
                modifiedLists.push(type);

                // Entries always are sorted on modified time, so this one will be at the start of the list
                listData.entries.unshift(entry);

                // Trigger the required events
                _.each(types, triggerUpdateList);
            };


            Object.assign(listData.object, {
                reload, getEntries, add,
                adopt, fetchMoreData, hasMoreData,
                isFetchingData, search, matchesQuery
            });

            return listData;
        };

        const getList = (type) => EMAIL_LISTS[type].object;

        const getLists = () => _.pluck(_.values(EMAIL_LISTS), 'object');

        const reload = () => $q.all(_.map(getLists(), (list) => list.reload()));

        Object.assign(EMAIL_LISTS, {
            blacklist: constructList('blacklist', Number(CONSTANTS.MAILBOX_IDENTIFIERS.spam)),
            whitelist: constructList('whitelist', Number(CONSTANTS.MAILBOX_IDENTIFIERS.inbox))
        });

        return { init: angular.noop, getList, getLists, deleteEntry, reload };
    });
