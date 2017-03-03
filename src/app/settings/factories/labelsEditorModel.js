angular.module('proton.settings')
    .factory('labelsEditorModel', (labelsModel) => {

        let LIST = [];
        let MAP = {};

        /**
         * Load current labels ordered by Order
         * Load cache order per label
         * @return {Array}
         */
        const load = () => {
            LIST = _.sortBy(labelsModel.get(), 'Order');
            MAP = _.reduce(LIST, (acc, { ID, Order }) => (acc[ID] = Order, acc), Object.create(null));
            return LIST;
        };

        /**
         * Get the order of the list via immutable map instead of the current item (the list is mutable, prevent Invalid input with duplicates Order)
         * @return {Array}
         */
        const getOrder = () => LIST.map(({ ID }) => MAP[ID]);

        /**
         * Sort labels list by Name (alphabetically)
         * @return {Array}
         */
        const sort = () => {
            LIST = _.sortBy(labelsModel.get(), ({ Name = '' }) => Name.toLowerCase());
            return LIST;
        };

        /**
         * Update the current list and also deffered the update of the immutable map
         * @return {void}
         */
        const update = () => {
            LIST = LIST.map((item, pos) => (item.Order = pos + 1, item));
            const id = setTimeout(() => {
                MAP = _.reduce(LIST, (acc, { ID, Order }) => (acc[ID] = Order, acc), {});
                clearTimeout(id);
            }, 200);
        };

        const clear = () => (MAP = {}, LIST.length = 0);

        return { load, update, getOrder, sort, clear };
    });
