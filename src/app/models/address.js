angular.module("proton.models.addresses", [])

.factory("Address", function($http, $q, url) {
    return {
        // POST
        /**
         * Add an address to a domain, returns {address_id} if successful, group address limit and usage
         * @param {Object} address
         * @return {Promise}
         */
        create: function(address) {
            return $http.post(url.get() + '/addresses', address);
        },
        // POST
        /**
         * Add an address to a domain, returns {address_id} if successful, group address limit and usage
         * @param {Object} address
         * @return {Promise}
         */
        setup: function(params) {
            return $http.post(url.get() + '/addresses/setup', params);
        },
        // PUT
        /**
         * Edit address
         * @param {String} addressID
         * @param {Object} params
         * @return {Promise}
         */
        edit: function(addressID, params) {
            return $http.put(url.get() + '/addresses/' + addressID, params);
        },
        /**
         * Enable address
         * @param {String} addressID
         * @return {Promise}
         */
        enable: function(addressID) {
            return $http.put(url.get() + '/addresses/' + addressID + '/enable');
        },
        /**
         * Disable address
         * @param {String} addressID
         * @return {Promise}
         */
        disable: function(addressID) {
            return $http.put(url.get() + '/addresses/' + addressID + '/disable');
        },
        // DELETE
        /**
         * Delete an address (alias), returns group address limit and usage
         * @param {String} addressID
         * @return {Promise}
         */
        delete: function(addressID) {
            return $http.delete(url.get() + '/addresses/' + addressID);
        }
    };
});
