angular.module("proton.models.members", ["proton.srp"])

.factory("Member", function($http, $q, url, srp) {
    return {
        // POST
        /**
         * Add a member to a group. This creates a new user. Returns the new {member_id} if successful.
         */
        create: function(Obj, password) {
            return srp.randomVerifier(password).then(function(pass_params) {
                return $http.post(url.get() + '/members', _.extend(Obj, pass_params));
            });
        },
        /**
         * Authenticate on behalf of a member to view her inbox.
         * @param {String} memberID
         * @param {Object} params
         * @return {Promise}
         */
        authenticate: function(memberID, params) {
            return $http.post(url.get() + '/members/' + memberID + '/auth', params);
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
        update: function(member) {
            return $http.put(url.get() + '/members/' + member.ID, member);
        },
        /**
         * Update member name
         * @param {String} memberID
         * @param {String} name
         * @return {Promise}
         */
        name: function(memberID, name) {
            return $http.put(url.get() + '/members/' + memberID + '/name', {
                Name: name
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
         * @param {Object} params
         * @return {Promise}
         */
        role: function(memberID, params) {
            return $http.put(url.get() + '/members/' + memberID + '/role', params);
        },
        /**
         * Update login password
         * @param {String} memberID
         * @param {String} password
         * @return {Promise}
         */
        password: function(memberID, password) {
            return srp.randomVerifier(password).then(function(pass_params) {
                return $http.put(url.get() + '/members/' + memberID + '/password', pass_params);
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
