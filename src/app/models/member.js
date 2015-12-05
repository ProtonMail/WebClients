angular.module("proton.models.members", [])

.factory("Member", function($http, $q, url) {
    return {
        // POST
        /**
         * Add a member to a group. This creates a new user. Returns the new {member_id} if successful.
         */
        create: function(Obj) {
            return $http.post(url.get() + '/members', Obj);
        },
        /**
         * Authenticate on behalf of a member to view her inbox.
         */
        authenticate: function() {
            return $http.post(url.get() + '/members/auth');
        },
        //GET
        query: function() {
            return $http.get(url.get() + '/members');
        },
        /**
         * Get member info, including UserID and key pair.
         */
        get: function(memberID) {
            return $http.get(url.get() + '/members/' + memberID);
        },
        // PUT
        /**
         * Re-assign user's email address, change the order in which member's addresses are listed, change login pw, change mailbox pw, change keys.
         */
        update: function(Obj) {
            var id = Obj.id;

            return $http.put(url.get() + '/members/' + id, Obj);
        },
        /**
         * Update member nickname
         * @param {String} memberID
         * @param {String} nickname
         * @return {Promise}
         */
        nickname: function(memberID, nickname) {
            return $http.put(url.get() + '/members/' + memberID + '/nickname', {
                Nickname: nickname
            });
        },
        /**
         * Update disk space quota in bytes
         * @param {String} memberID
         * @param {Integer} space
         * @return {Promise}
         */
        quota: function(memberID, space) {
            return $http.put(url.get() + '/members/' + memberID + '/quota', {
                MaxSpace: space
            });
        },
        /**
         * Update role
         * @param {String} memberID
         * @param {Integer} role
         * @return {Promise}
         */
        role: function(memberID, role) {
            return $http.put(url.get() + '/members/' + memberID + '/role', {
                Role: role
            });
        },
        /**
         * Update login password
         * @param {String} memberID
         * @param {String} password
         * @return {Promise}
         */
        password: function(memberID, password) {
            return $http.put(url.get() + '/members/' + memberID + '/password', {
                Password: password
            });
        },
        /**
         * Make account private
         * @param {String} memberID
         * @return {Promise}
         */
         private: function(memberID) {
             return $http.put(url.get() + '/members/' + memberID + '/private');
         },
        // DELETE
        /**
         * Nuke the member. Protect against nuking the group owner.
         */
        delete: function(memberID) {
            return $http.delete(url.get() + '/members/' + memberID);
        },
        /**
         * Revoke token.
         */
        revoke: function() {
            return $http.delete(url.get() + 'members/auth');
        }
    };
});
