angular.module('proton.labels')
    .factory('labelsModel', ($rootScope, CONSTANTS) => {

        const ACTIONS = {
            [CONSTANTS.STATUS.DELETE]: 'remove',
            [CONSTANTS.STATUS.CREATE]: 'create',
            [CONSTANTS.STATUS.UPDATE]: 'update'
        };

        const CACHE = {
            labels: [],
            folders: [],
            all: [],
            map: {
                all: {},
                folders: {},
                labels: {}
            }
        };

        const dispatch = (type, data = {}) => $rootScope.$emit('labelsModel', { type, data });

        /**
         * Clean label datas received from the BE
         * @param  {Array} labels
         * @return {Array}
         */
        function cleanLabels(labels = []) {
            return labels.map((label) => {
                label.Name = DOMPurify.sanitize(label.Name);
                label.Color = DOMPurify.sanitize(label.Color);
                return label;
            });
        }

        /**
         * Create a cache ref map from the current list of labels.
         * A map for
         *     - all
         *     - folders
         *     - labels
         * @return {void}
         */
        const syncMap = () => {
            CACHE.map = _.reduce(CACHE.all, (acc, label) => {
                const key = (label.Exclusive === 0) ? 'labels' : 'folders';
                acc.all[label.ID] = label;
                acc[key][label.ID] = label;
                return acc;
            }, { all: Object.create(null), labels: Object.create(null), folders: Object.create(null) });
        };

        const syncLabels = () => {
            CACHE.labels = _.chain(CACHE.all)
                .where({ Exclusive: 0 })
                .sortBy('Order')
                .value();
        };

        const syncFolders = () => {
            CACHE.folders = _.chain(CACHE.all)
                .where({ Exclusive: 1 })
                .sortBy('Order')
                .value();
        };

        /**
         * Create cache and create others cache and map ref.
         * @param  {Array}  list
         * @return {void}
         */
        const set = (list = []) => {
            CACHE.all = cleanLabels(list);
            syncMap();
            syncLabels();
            syncFolders();
        };

        /**
         * Get a list (a copy) of labels by type
         *     - all (default) (non-sorted)
         *     - labels sorted by Order
         *     - folders sorted by Order
         * @param  {String} key
         * @return {Array}     A copy of the list
         */
        const get = (key = 'all') => angular.copy(CACHE[key]);

        /**
         * Access to a label by its id and its typeof
         * @param  {String} id
         * @param  {String} type all (default) | folders | labels
         * @return {Object} undefined if there is no label
         */
        const read = (id, type = 'all') => CACHE.map[type][id];

        /**
         * Check if a label exist
         * @param  {String} id
         * @param  {String} type all (default) | folders | labels
         * @return {Boolean}
         */
        const contains = (id, type = 'all') => !!read(id, type);

        /**
         * Get all ids per type
         * @param  {String} type all (default) | folders | labels
         * @return {Array}
         */
        const ids = (type = 'all') => Object.keys(CACHE.map[type] || {});

        /**
         * Sync a list of events to update the cache
         * Dispatch an event type:cache.update with the todo update config
         * @param  {Array}  list
         * @return {void}
         */
        const sync = (list = []) => {

            const todo = list.reduce((acc, { ID, Label = {}, Action }) => {
                const action = ACTIONS[Action];

                if (action === 'create') {
                    acc[action].push(Label);
                    return acc;
                }
                // Label does not exist for DELETE
                acc[action][ID] = Label;
                return acc;
            }, { update: {}, create: [], remove: {} });

            CACHE.all = _.chain(CACHE.all)
                .map((label) => todo.update[label.ID] || label)
                .filter(({ ID }) => !todo.remove[ID])
                .value()
                .concat(todo.create);

            syncMap();
            syncLabels();
            syncFolders();

            dispatch('cache.update', todo);
        };

        const refresh = () => {
            syncMap();
            syncLabels();
            syncFolders();
            dispatch('cache.refresh');
        };

        $rootScope.$on('AppModel', (e, { type, data = {} }) => {
            (type === 'loggedIn' && !data.value) && set();
        });

        return { get, set, contains, sync, read, ids, refresh };
    });
