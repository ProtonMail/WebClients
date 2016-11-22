angular.module('proton.models.keys', ['proton.srp'])
.factory('Key', ($http, $q, url, srp) => {
    return {
        /**
         * Create a new key
         * @param {Object} params
         * @return {Promise}
         */
        create(params = {}) {
            return $http.post(url.get() + '/keys', params);
        },
        /**
         * Install a new key for each address
         * @param {Object} params
         * @return {Promise}
         */
        setup(params = {}, newPassword = '') {
            if (newPassword.length) {
                return srp
                    .getPasswordParams(newPassword, params)
                    .then((data) => $http.post(url.get() + '/keys/setup', data));
            }

            return $http.post(url.get() + '/keys/setup', params);
        },
        /**
         * Install a new key for each address
         * @param {Object} params
         * @return {Promise}
         */
        reset(params = {}, newPassword = '') {
            if (newPassword.length) {
                return srp
                .getPasswordParams(newPassword, params)
                .then((data) => $http.post(url.get() + '/keys/reset', data));
            }
            return $http.post(url.get() + '/keys/reset', params);
        },
        /**
         * Update key priority
         * @param {Object} params
         * @return {Promise}
         */
        order(params = {}) {
            return $http.post(url.get() + '/keys/order', params);
        },
        /**
         * Update entire key, including public key
         * @param {String} keyID
         * @param {Object} params
         * @return {Promise}
         */
        update(keyID, params = {}) {
            return $http.put(url.get() + '/keys/' + keyID, params);
        },
        /**
         * Update private key only, use for password updates
         * @param {Object} params
         * @return {Promise}
         */
        private(params = {}, newPassword = '') {
            if (newPassword.length) {
                return srp
                    .getPasswordParams(newPassword, params)
                    .then((authParams) => srp.performSRPRequest('PUT', '/keys/private', authParams));
            }

            return srp.performSRPRequest('PUT', '/keys/private', params);
        },
        /**
         * Delete key
         * @param {String} keyID
         * @return {Promise}
         */
        delete(keyID) {
            return $http.delete(url.get() + '/keys/' + keyID);
        }
    };
});
