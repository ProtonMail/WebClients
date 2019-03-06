import _ from 'lodash';
import { flow, filter, sortBy, map } from 'lodash/fp';

import { LABEL_TYPE } from '../../constants';
import updateCollection from '../../utils/helpers/updateCollection';

/* @ngInject */
function labelCache(sanitize, Label) {
    return (dispatch = _.noop, labelType = LABEL_TYPE.MESSAGE) => {
        const defaultMaps = () => ({
            all: Object.create(null),
            labels: Object.create(null),
            folders: Object.create(null),
            names: Object.create(null)
        });

        const IS_LABEL = 0;
        const IS_FOLDER = 1;
        const CACHE = {
            labels: [],
            folders: [],
            all: [],
            map: defaultMaps()
        };

        function cleanLabel(label) {
            label.Name = sanitize.input(label.Name);
            label.Color = sanitize.input(label.Color);
            label.notify = !!label.Notify;
            return label;
        }

        /**
         * Take raw list of labels from event or GET API.
         * Always clean + sort the list
         * @param  {Array}  list
         * @return {Array}
         */
        const formatAll = (list = []) => {
            return flow(
                map(cleanLabel),
                sortBy('Order')
            )(list);
        };

        /**
         * Create a cache ref map from the current list of labels.
         * A map for
         *     - all
         *     - folders
         *     - labels
         * @return {void}
         */
        const syncMap = () => {
            CACHE.map = _.reduce(
                CACHE.all,
                (acc, label) => {
                    const key = label.Exclusive === 0 ? 'labels' : 'folders';
                    acc.all[label.ID] = label;
                    acc[key][label.ID] = label;
                    acc.names[label.Name] = label;
                    return acc;
                },
                defaultMaps()
            );
        };

        const syncType = (type) => {
            return flow(
                filter({ Exclusive: type }),
                sortBy('Order')
            )(CACHE.all);
        };

        const syncLabels = () => {
            CACHE.labels = syncType(IS_LABEL);
        };

        const syncFolders = () => {
            CACHE.folders = syncType(IS_FOLDER);
        };

        /**
         * Create cache and create others cache and map ref.
         * @param  {Array}  list
         * @return {void}
         */
        const set = (list = []) => {
            CACHE.all = formatAll(list);
            syncMap();
            syncLabels();
            syncFolders();
        };

        /**
         * Get a list (a copy) of labels by type
         *     - all (default) (sorted)
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
         * Access to a label by its name
         * @param  {String} name
         * @return {Object} undefined if there is no label
         */
        const readName = (name) => CACHE.map.names[name];

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
            const { collection, todo } = updateCollection(CACHE.all, list, 'Label');

            CACHE.all = formatAll(collection);
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

        const sort = (type = 'Name') => {
            CACHE.all = _.sortBy(CACHE.all, ({ [type]: Key }) => {
                if (typeof Key === 'number') {
                    return Key;
                }
                return (Key || '').toLowerCase();
            });
            dispatch('cache.update');
            return CACHE.all;
        };

        const load = async (event = false) => {
            const data = await Label.query({ Type: labelType });
            set(data);
            event && dispatch('cache.refresh');
            dispatch('cache.load');
            return data;
        };

        const remove = (IDS = []) => {
            CACHE.all = CACHE.all.filter(({ ID }) => !IDS.includes(ID));
            dispatch('cache.remove', IDS);
            refresh();
        };

        return {
            load,
            get,
            set,
            contains,
            sort,
            sync,
            read,
            readName,
            ids,
            refresh,
            remove,
            IS_LABEL,
            IS_FOLDER
        };
    };
}
export default labelCache;
