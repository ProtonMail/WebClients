angular.module("proton.models.incomingDefaults", [])

.factory("IncomingDefault", function($http, $q, url) {
    return {

        // GET
        /**
         * Get all default rules
         */
        get: function(id) {
            return $http.get(url.get() + '/incomingdefaults');
        },

        // POST
        /**
         * Create a new default rule
         */
        add: function(Obj) {
            return $http.post(url.get() + '/incomingdefaults', Obj);
        },

        // PUT
        /**
        * Update a rule
        */
        update: function(Obj) {
            var id = Obj.id;
            return $http.put(url.get() + '/incomingdefaults/' + id, Obj);
        },

        /**
        * Delete rule(s)
        */
        delete: function(Obj) {
            return $http.put(url.get() + '/incomingdefaults/delete', Obj);
        },

        // DELETE
        clear: function(id) {
            return $http.delete(url.get() + '/incomingdefaults');
        }

    };
});
