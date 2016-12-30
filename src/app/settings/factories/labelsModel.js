angular.module('proton.settings')
    .factory('labelsModel', (authentication) => {

        let LIST = [];
        let MAP = {};

        /**
         * Load current labels ordered by Order
         * Load cache order per label
         * @return {Array}
         */
        const load = () => {
            LIST = _.sortBy(authentication.user.Labels, 'Order');
            MAP = _.reduce(LIST, (acc, { ID, Order }) => (acc[ID] = Order, acc), {});
            return LIST;
        };

        /**
         * Get the order of the list via immutable map instead of the current item (the list is mutable, prevent Invalid input with duplicates Order)
         * @return {Array}
         */
        const getOrder = () => LIST.map(({ ID }) => MAP[ID]);

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

        return { load, update, getOrder, clear };
    });
