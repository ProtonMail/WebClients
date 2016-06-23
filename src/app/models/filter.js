angular.module('proton.models.filter', [])

.factory('Filter', function($http, $state, url, tools, CONFIG) {
    /**
     * Transform the filter model before to send it to the back-end
     */
    var transformRequestFilter = function(filter) {
        if (angular.isDefined(filter.Simple)) {
            console.log(angular.toJson(filter.Simple));
            filter.Tree = Sieve.toTree(filter.Simple);
            console.log(angular.toJson(filter.Tree));
        }

        return angular.toJson(filter);
    };

    /**
     * Transform the datas received
     */
    var transformResponseFilter = function(data, headersGetter, status) {
        data = angular.fromJson(data);

        if (data.Code === 1000) {
            _.each(data.Filters, function(filter) {
                filter.Simple = Sieve.fromTree(filter.Tree);
            });
        }

        return data;
    };

    var Filter = {
        /**
         * Add filter to the current user
         * @param {Object} filter
         * @return {Promise}
         */
        create: function(filter) {
            return $http.post(url.get() + '/filters', filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Get filters owned by the current user
         * @return {Promise}
         */
        query: function() {
            return $http.get(url.get() + '/filters', {
                transformResponse: transformResponseFilter
            });
        },
        /**
         * Update filter
         * @param {Object} filter
         * @return {Promise}
         */
        update: function(filter) {
            return $http.put(url.get() + '/filters/' + filter.ID, filter, {
                transformRequest: transformRequestFilter
            });
        },
        /**
         * Enable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        enable: function(filter) {
            return $http.put(url.get() + '/filters/' + filter.ID + '/enable');
        },
        /**
         * Disable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        disable: function(filter) {
            return $http.put(url.get() + '/filters/' + filter.ID + '/disable');
        },
        /**
         * Update custom filter order
         * @param {Array} order
         * @return {Promise}
         */
        order: function(order) {
            return $http.put(url.get() + '/filters/order', order);
        },
        /**
         * Delete a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        delete: function(filter) {
            return $http.delete(url.get() + '/filters/' + filter.ID);
        },
        /**
         * Clear filter
         * @return {Promise}
         */
        clear: function() {
            return $http.delete(url.get() + '/filters');
        }
    };

    return Filter;
});
