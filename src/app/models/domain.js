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
        /**
         * Verify MX, SPF and DKIM records
         */
        verify: function(Obj) {
            var id = Obj.ID;

            return $http.post(url.get() + '/domains/' + id, Obj);
        },
        // GET
        /**
         * Get all domains for this user's organization and check their DNS's
         */
        query: function() {
            return $http.get(url.get() + '/domains');
        },
        /**
         * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
         */
        get: function(id) {
            return $http.get(url.get() + '/domains/' + id);
        },
        // PUT
        /**
         * Update the domain name, add and delete addresses, set forwarding / MX record use
         */
        update: function(Obj) {
            var id = Obj.ID;

            return $http.put(url.get() + '/domains/' + id, Obj);
        },
        // DELETE
        delete: function(id) {
            return $http.delete(url.get() + '/domains/' + id);
        }
    };
});
