angular.module('proton.models.filter', [])

.factory('Filter', function($http, url) {

    var Filter = {
        /**
         * Add filter to the current user
         * @param {Object} filter
         * @return {Promise}
         */
        create: function(filter) {
            return $http.post(url.get() + '/filters', filter);
        },
        /**
         * Get filters owned by the current user
         * @return {Promise}
         */
        query: function() {
            return $http.get(url.get() + '/filters');
        },
        /**
         * Update filter
         * @param {Object} filter
         * @return {Promise}
         */
        update: function(filter) {
            return $http.put(url.get() + '/filter/' + filter.ID, filter);
        },
        /**
         * Enable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        enable: function(filter) {
            return $http.put(url.get() + '/filter/' + filter.ID + '/enable');
        },
        /**
         * Disable a specific filter
         * @param {Object} filter
         * @return {Promise}
         */
        disable: function(filter) {
            return $http.put(url.get() + '/filter/' + filter.ID + '/disable');
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
