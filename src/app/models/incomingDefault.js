angular.module('proton.models.incomingDefaults', [])

.factory('IncomingDefault', ($http, $q, url) => {
    return {

        // GET
        /**
         * Get all default rules
         */
        get() {
            return $http.get(url.get() + '/incomingdefaults');
        },

        // POST
        /**
         * Create a new default rule
         */
        add(params) {
            return $http.post(url.get() + '/incomingdefaults', params);
        },

        // PUT
        /**
        * Update a rule
        */
        update(params) {
            const id = params.ID;

            return $http.put(url.get() + '/incomingdefaults/' + id, params);
        },

        /**
        * Delete rule(s)
        */
        delete(params) {
            return $http.put(url.get() + '/incomingdefaults/delete', params);
        },

        // DELETE
        clear() {
            return $http.delete(url.get() + '/incomingdefaults');
        }

    };
});
