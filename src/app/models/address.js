angular.module("proton.models.addresses", [])

.factory("Address", function($http, url) {
    return {
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
