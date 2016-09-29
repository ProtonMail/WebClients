angular.module('proton.models.keys', ['proton.srp'])

.factory('Key', function($http, $q, url, srp) {
    return {
        /**
         * Create a new key
         * @param {Object} params
         * @return {Promise}
         */
        create: function(params = {}) {
            return $http.post(url.get() + '/keys', params);
        },
        /**
         * Install a new key for each address
         * @param {Object} params
         * @return {Promise}
         */
        setup: function(params = {}, newPassword = '') {
            if (newPassword.length) {
                return srp.randomVerifier(newPassword).then(function(auth_params) {
                    return $http.post(url.get() + '/keys/setup', _.extend(params,auth_params));
                });
            }
            return $http.post(url.get() + '/keys/setup', params);
        },
        /**
         * Install a new key for each address
         * @param {Object} params
         * @return {Promise}
         */
        reset: function(params = {}, newPassword = '') {
            if (newPassword.length) {
                return srp.randomVerifier(newPassword).then(function(auth_params) {
                    return $http.post(url.get() + '/keys/reset', _.extend(params,auth_params));
                });
            }
            return $http.post(url.get() + '/keys/reset', params);
        },
        /**
         * Update key priority
         * @param {Object} params
         * @return {Promise}
         */
        order: function(params = {}) {
            return $http.post(url.get() + '/keys/order', params);
        },
        /**
         * Update entire key, including public key
         * @param {String} keyID
         * @param {Object} params
         * @return {Promise}
         */
        update: function(keyID, params = {}) {
            return $http.put(url.get() + '/keys/' + keyID, params);
        },
        /**
         * Update private key only, use for password updates
         * @param {Object} params
         * @return {Promise}
         */
        private: function(params = {}, creds = {}, newPassword = '') {
            if (newPassword.length) {
                return srp.randomVerifier(newPassword).then(function(auth_params) {
                    return srp.performSRPRequest("PUT", '/keys/private', _.extend(params,auth_params), creds);
                });
            }
            return srp.performSRPRequest("PUT", '/keys/private', params, creds);
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
