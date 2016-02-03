angular.module("proton.models.domains", [])

.factory("Domain", function($http, $q, url) {
    return {
        // POST
        /**
         * Create a domain of a given name
         */
        create: function(Obj) {
            return $http.post(url.get() + '/domains', Obj);
        },
        // GET
        /**
         * Get all domains for this user's organization and check their DNS's
         */
        query: function() {
            return $http.get(url.get() + '/domains');
        },
        /**
        * Return the list of domains available during the signing process
        */
        available: function() {
            return $http.get(url.get() + '/domains/available');
        },
        /**
         * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
         */
        get: function(id) {
            return $http.get(url.get() + '/domains/' + id);
        },
        // DELETE
        delete: function(id) {
            return $http.delete(url.get() + '/domains/' + id);
        }
    };
});
