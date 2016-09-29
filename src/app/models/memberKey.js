angular.module('proton.models.memberKeys', [])

.factory('MemberKey', function($http, url) {
    return {
        // POST
        /**
         * Create new member key
         * @param {Object} Obj
         * @return {Promise}
         */
        create: function(Obj) {
            return $http.post(url.get() + '/memberkeys', Obj);
        },
        /**
         * Update member key priority
         * @param {Object} Obj
         * @return {Promise}
         */
        order: function(Obj) {
            return $http.post(url.get() + '/memberkeys/order', Obj);
        },
        // PUT
        /**
         * Update part of key or entire key, updating
         * @param {String} keyID
         * @param {Object} Obj
         * @return {Promise}
         */
        update: function(keyID, Obj) {
            return $http.put(url.get() + '/memberkeys' + keyID, Obj);
        },
        // DELETE
        /**
         * Update member key priority
         * @param {String} keyID
         * @return {Promise}
         */
        delete: function(keyID) {
            return $http.delete(url.get() + '/memberkeys/' + keyID);
        }
     };
});
