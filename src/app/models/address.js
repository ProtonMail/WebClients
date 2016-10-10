angular.module('proton.models.addresses', [])

.factory('Address', ($http, $q, url) => {
    return {
        // POST
        /**
         * Add an address to a domain, returns {address_id} if successful, group address limit and usage
         * @param {Object} address
         * @return {Promise}
         */
        create(address) {
            return $http.post(url.get() + '/addresses', address);
        },
        // POST
        /**
         * Add an address to a domain, returns {address_id} if successful, group address limit and usage
         * @param {Object} address
         * @return {Promise}
         */
        setup(params) {
            return $http.post(url.get() + '/addresses/setup', params);
        },
        // PUT
        /**
         * Edit address
         * @param {String} addressID
         * @param {Object} params
         * @return {Promise}
         */
        edit(addressID, params) {
            return $http.put(url.get() + '/addresses/' + addressID, params);
        },
        /**
         * Enable address
         * @param {String} addressID
         * @return {Promise}
         */
        enable(addressID) {
            return $http.put(url.get() + '/addresses/' + addressID + '/enable');
        },
        /**
         * Disable address
         * @param {String} addressID
         * @return {Promise}
         */
        disable(addressID) {
            return $http.put(url.get() + '/addresses/' + addressID + '/disable');
        },
        // DELETE
        /**
         * Delete an address (alias), returns group address limit and usage
         * @param {String} addressID
         * @return {Promise}
         */
        delete(addressID) {
            return $http.delete(url.get() + '/addresses/' + addressID);
        }
    };
});
