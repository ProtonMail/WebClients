/* @ngInject */
function Filter($http, url, $injector) {
    const requestUrl = url.build('filters');
    // lazy loading the Sieve.js library through injector.
    /**
     * Transform the filter model before to send it to the back-end
     */
    function transformRequestFilter(filter) {
        const tree = $injector.get('simpleFilter').computeTree(filter);
        if (tree) {
            filter.Tree = tree;
        }

        return angular.toJson(filter);
    }

    const Filter = {
        /**
         * Add filter to the current user
         * @param {Object} filter
         * @return {Promise}
         */
        create(filter) {
            return $http.post(requestUrl(), filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Check filter syntax
         * @param {Object} filter
         * @return {Promise}
         */
        check(filter) {
            return $http.put(requestUrl('check'), filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Get filters owned by the current user
         * @return {Promise}
         */
        async query() {
            const {
                data: { Filters = [] }
            } = await $http.get(requestUrl());

            return Filters.map((filter) => {
                const simple = $injector.get('simpleFilter').computeFromTree(filter);
                if (simple) {
                    filter.Simple = simple;
                } else {
                    delete filter.Simple;
                }
                return filter;
            });
        },
        /**
         * Update filter
         * @param {Object} filter
         * @return {Promise}
         */
        update(filter) {
            return $http.put(requestUrl(filter.ID), filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Enable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        enable(filter) {
            return $http.put(requestUrl(filter.ID, 'enable'));
        },
        /**
         * Disable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        disable(filter) {
            return $http.put(requestUrl(filter.ID, 'disable'));
        },
        /**
         * Update custom filter order
         * @param {Array} order
         * @return {Promise}
         */
        order(order) {
            return $http.put(requestUrl('order'), order);
        },
        /**
         * Delete a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        delete(filter) {
            return $http.delete(requestUrl(filter.ID));
        },
        /**
         * Clear filter
         * @return {Promise}
         */
        clear() {
            return $http.delete(requestUrl());
        }
    };

    return Filter;
}
export default Filter;
