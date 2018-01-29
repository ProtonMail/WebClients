import _ from 'lodash';

/* @ngInject */
function Filter($http, url) {
    /**
     * Transform the filter model before to send it to the back-end
     */
    function transformRequestFilter(filter) {
        if (angular.isDefined(filter.Simple)) {
            filter.Tree = Sieve.toTree(filter.Simple);
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
            return $http.post(url.get() + '/filters', filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Check filter syntax
         * @param {Object} filter
         * @return {Promise}
         */
        check(filter) {
            return $http.post(url.get() + '/filters/check', filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Get filters owned by the current user
         * @return {Promise}
         */
        query() {
            return $http.get(url.get() + '/filters').then(({ data = {} } = {}) => {
                _.each(data.Filters, (filter) => {
                    const simple = Sieve.fromTree(filter.Tree);
                    if (_.isEqual(filter.Tree, Sieve.toTree(simple))) {
                        filter.Simple = simple;
                    } else {
                        delete filter.Simple;
                    }
                });
                return data;
            });
        },
        /**
         * Update filter
         * @param {Object} filter
         * @return {Promise}
         */
        update(filter) {
            return $http.put(url.get() + '/filters/' + filter.ID, filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Enable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        enable(filter) {
            return $http.put(url.get() + '/filters/' + filter.ID + '/enable');
        },
        /**
         * Disable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        disable(filter) {
            return $http.put(url.get() + '/filters/' + filter.ID + '/disable');
        },
        /**
         * Update custom filter order
         * @param {Array} order
         * @return {Promise}
         */
        order(order) {
            return $http.put(url.get() + '/filters/order', order);
        },
        /**
         * Delete a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        delete(filter) {
            return $http.delete(url.get() + '/filters/' + filter.ID);
        },
        /**
         * Clear filter
         * @return {Promise}
         */
        clear() {
            return $http.delete(url.get() + '/filters');
        }
    };

    return Filter;
}
export default Filter;
