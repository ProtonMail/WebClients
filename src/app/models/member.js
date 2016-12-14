angular.module('proton.models.members', [])

.factory('Member', ($http, $q, url, srp) => {
    return {
        // POST
        /**
         * Add a member to a group. This creates a new user. Returns the new {member_id} if successful.
         */
        create(Obj, password) {
            return srp
                .getPasswordParams(password, Obj)
                .then((data) => $http.post(url.get() + '/members', data));
        },
        /**
         * Authenticate on behalf of a member to view her inbox.
         * @param {String} memberID
         * @param {Object} params
         * @return {Promise}
         */
        authenticate(memberID, params) {
            return srp.performSRPRequest('POST', '/members/' + memberID + '/auth', {}, params);
        },
        // GET
        query() {
            return $http.get(url.get() + '/members');
        },
        /**
         * Get member info, including UserID and key pair.
         */
        get(memberID) {
            return $http.get(url.get() + '/members/' + memberID);
        },
        // PUT
        /**
         * Update member name
         * @param {String} memberID
         * @param {String} name
         * @return {Promise}
         */
        name(memberID, name) {
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
        quota(memberID, space) {
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
        role(memberID, params) {
            return $http.put(url.get() + '/members/' + memberID + '/role', params);
        },
        /**
         * Update login password
         * @param {String} memberID
         * @param {String} password
         * @return {Promise}
         */
        password(memberID, password) {
            return srp
                .getPasswordParams(password)
                .then((data) => $http.post('/members/' + memberID + '/password', data));
        },
        /**
         * Make account private
         * @param {String} memberID
         * @return {Promise}
         */
        privatize(memberID) {
            return $http.put(url.get() + '/members/' + memberID + '/privatize');
        },

        // DELETE
        /**
         * Nuke the member. Protect against nuking the group owner.
         */
        delete(memberID) {
            return $http.delete(url.get() + '/members/' + memberID);
        },
        /**
         * Revoke token.
         */
        revoke() {
            return $http.delete(url.get() + 'members/auth');
        }
    };
});
