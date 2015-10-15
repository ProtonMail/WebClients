angular.module("proton.models.domains", [])

.factory("Domain", function($http, url) {
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
            var id = Obj.id;

            return $http.post(url.get() + '/domains/' + id, Obj);
        },
        // GET
        /**
         * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
         */
        get: function(Obj) {
            var id = Obj.id;

            return $http.get(url.get() + '/domains/' + id, Obj);
        },
        // PUT
        /**
         * Update the domain name, add and delete addresses, set forwarding / MX record use
         */
        update: function(Obj) {
            var id = Obj.id;

            return $http.put(url.get() + '/domains/' + id, Obj);
        },
        // DELETE
        delete: function(Obj) {
            var id = Obj.id;

            return $http.delete(url.get() + '/domains/' + id, Obj);
        }
    };
});
