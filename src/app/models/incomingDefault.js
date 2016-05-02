angular.module("proton.models.incomingDefaults", [])

.factory("IncomingDefault", function($http, $q, url) {
    return {

        // GET
        /**
         * Get all default rules
         */
        get: function() {
            return $http.get(url.get() + '/incomingdefaults');
        },

        // POST
        /**
         * Create a new default rule
         */
        add: function(params) {
            return $http.post(url.get() + '/incomingdefaults', params);
        },

        // PUT
        /**
        * Update a rule
        */
        update: function(params) {
            var id = params.ID;

            return $http.put(url.get() + '/incomingdefaults/' + id, params);
        },

        /**
        * Delete rule(s)
        */
        delete: function(params) {
            return $http.put(url.get() + '/incomingdefaults/delete', params);
        },

        // DELETE
        clear: function(id) {
            return $http.delete(url.get() + '/incomingdefaults');
        }

    };
});
