angular.module('proton.models.filter', [])

.factory('Filter', ($http, url) => {
    /**
     * Transform the filter model before to send it to the back-end
     */
    function transformRequestFilter(filter) {
        if (angular.isDefined(filter.Simple)) {
            filter.Tree = Sieve.toTree(filter.Simple);
        }

        return angular.toJson(filter);
    }

    /**
     * Transform the datas received
     */
    function transformResponseFilter(data) {
        const json = angular.fromJson(data);

        if (json && json.Code === 1000) {
            _.each(json.Filters, (filter) => {
                filter.Simple = Sieve.fromTree(filter.Tree);
            });
        }

        return json || {};
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
         * Get filters owned by the current user
         * @return {Promise}
         */
        query() {
            return $http.get(url.get() + '/filters', {
                transformResponse: transformResponseFilter
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
});
