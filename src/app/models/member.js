angular.module("proton.models.members", [])

.factory("Member", function($http, url) {
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
        /**
         * Get member info, including UserID and key pair.
         */
        get: function(id) {
            return $http.get(url.get() + '/members/' + id);
        },
        // PUT
        /**
         * Re-assign user's email address, change the order in which member's addresses are listed, change login pw, change mailbox pw, change keys.
         */
        update: function(Obj) {
            var id = Obj.id;

            return $http.put(url.get() + '/members/' + id, Obj);
        },
        // DELETE
        /**
         * Nuke the member. Protect against nuking the group owner.
         */
        delete: function(id) {
            return $http.delete(url.get() + '/members/' + id);
        },
        /**
         * Revoke token.
         */
        revoke: function() {
            return $http.delete(url.get() + 'members/auth');
        }
    };
});
