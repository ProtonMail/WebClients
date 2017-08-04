angular.module('proton.settings')
    .factory('labelsEditorModel', (labelsModel) => {

        const CACHE = {
            LIST: [],
            MAP: {}
        };


        /**
         * Load current labels ordered by Order
         * Load cache order per label
         * @return {Array}
         */
        const load = () => {
            CACHE.LIST = _.sortBy(labelsModel.get(), 'Order');
            CACHE.MAP = _.reduce(CACHE.LIST, (acc, { ID, Order }) => (acc[ID] = Order, acc), Object.create(null));
            return CACHE.LIST;
        };

        /**
         * Get the order of the list via immutable map instead of the current item (the list is mutable, prevent Invalid input with duplicates Order)
         * @return {Array}
         */
        const getOrder = () => CACHE.LIST.map(({ ID }) => CACHE.MAP[ID]);

        /**
         * Sort labels list by Name (alphabetically)
         * @return {Array}
         */
        const sort = () => {
            CACHE.LIST = _.sortBy(labelsModel.get(), ({ Name = '' }) => Name.toLowerCase());
            return CACHE.LIST;
        };

        /**
         * Update the current list and also deffered the update of the immutable map
         * @return {void}
         */
        const update = () => {
            CACHE.LIST = CACHE.LIST.map((item, pos) => (item.Order = pos + 1, item));
            _.delay(() => {
                CACHE.MAP = _.reduce(CACHE.LIST, (acc, { ID, Order }) => (acc[ID] = Order, acc), {});
            }, 300);
        };

        const clear = () => (CACHE.MAP = {}, CACHE.LIST.length = 0);

        return { load, update, getOrder, sort, clear };
    });
