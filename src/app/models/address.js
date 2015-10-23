angular.module("proton.models.addresses", [])

.factory("Address", function($http, $q, url) {
    return {
        // GET
        query: function() {
            var deferred = $q.defer();

            deferred.resolve([
                {
                    "AddressID": "hCjg4nXWswD5EhdgWrKr2xP3D-99QRPot3H3hg7yBfLZ9GOrjBEJuc3-rO7u-0WevfX4WSFcfgps8O3qKJAZxQ==",
                    "Email": "elliot@e-corp.com",
                    "DisplayName": "Elliot Alderson",
                    "Send": 0
                },
                {
                    "AddressID": "kBZYBzgHWtjW5igU33BXqwVZ66GBdJi4ycXPzZjyUmp840-O2yXyNEO0ayRveZKNnASS_btzUY-WkI_mcvNuOg==",
                    "Email": "security@e-corp.com",
                    "DisplayName": "Security",
                    "Send": 1
                },
                {
                    "AddressID": "dRs2Vv64Vru392SbvvG1MbEt3Ep5P_EWz8WbHVAOl_6h_Ty9jItyktkVcfz9-xRvCGwFq_TW7i8FtJaGyFEq0g==",
                    "DisplayName": "Mr. Robot",
                    "Email": "mr.r@fsociety.org",
                    "Send": 2
                }
            ]);

            return deferred.promise;
            // return $http.get(url.get() + '/addresses');
        },
        // POST
        /**
         * Add an address to a domain, returns {address_id} if successful, group address limit and usage
         */
        create: function(Obj) {
            return $http.post(url.get() + '/addresses', Obj);
        },
        // PUT
        /**
         * Assign address to a user / group member
         */
        update: function(Obj) {
            var id = Obj.id;

            return $http.put(url.get() + '/addresses/' + id, Obj);
        },
        // DELETE
        /**
         * Delete an address (alias), returns group address limit and usage
         */
        delete: function(Obj) {
            var id = Obj.id;

            return $http.delete(url.get() + '/addresses/' + id, Obj);
        }
    };
});
