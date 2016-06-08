angular.module('proton.models.keys', [])

.factory('Key', function($http, $q, url) {
    return {
        /**
         * Create a new key
         * @param {Object} params
         * @return {Promise}
         */
        create: function(params) {
            return $http.post(url.get() + '/keys', params);
        },
        /**
         * Install a new key for each address
         * @param {Object} params
         * @return {Promise}
         */
        reset: function(params) {
            return $http.post(url.get() + '/keys/reset', params);
        },
        /**
         * Update key priority
         * @param {Object} params
         * @return {Promise}
         */
        order: function(params) {
            return $http.post(url.get() + '/keys/order', params);
        },
        /**
         * Update entire key, including public key
         * @param {String} keyID
         * @param {Object} params
         * @return {Promise}
         */
        update: function(keyID, params) {
            return $http.put(url.get() + '/keys/' + keyID, params);
        },
        /**
         * Update private key only, use for password updates
         * @param {Object} params
         * @return {Promise}
         */
        private: function(params) {
            return $http.put(url.get() + '/keys/private', params);
        },
        /**
         * Delete key
         * @param {String} keyID
         * @return {Promise}
         */
        delete: function(keyID) {
            return $http.delete(url.get() + '/keys/' + keyID);
        }
    };
});
