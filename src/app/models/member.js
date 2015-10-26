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
            var deferred = $q.defer();

            deferred.resolve({
                "Members": [
                    {
                        "MemberID": "q6fRrEIn0nyJBE_-YSIiVf80M2VZhOuUHW5In4heCyOdV_nGibV38tK76fPKm7lTHQLcDiZtEblk0t55wbuw4w==",
                        "UserName": "max.mustermann",
                        "DisplayName": "Max Mustermann",
                        "NotificationEmail": "max123@gmail.com",
                        "Role": 0,
                        "UsedSpace": 1,
                        "MaxSpace": 1024,
                        "AddressIDs": [
                            "UVhawo1URvrpvbnp1FaDO2RhoaENS5Ge8bJ4PT4U4ATqZeZTNGrVD1vM2JpeQP8tMMQQ9iqDEIz2u4werNZIRw==",
                            "fT-fHNQexHafNYev4Qz49aetYhhjFOJCD8E8GYYOMY6o0U9WwINhnI76D9k7f6WB8_GaMISfd3a_cxe6vEUGxw=="
                        ],
                    },
                    {
                        "MemberID": "0WjWEbOmKh7F2a1Snx2FJKA7a3Fm05p-nIZ0TqiHjDDUa6oHnsyWeeVXgSuzumCmFE8_asJsom9ZzGbx-eDecw==",
                        "UserName": "elliot@e-corp.com",
                        "DisplayName": "Elliot Alderson",
                        "NotificationEmail": "elliot.alderson@protonmail.com",
                        "Role": 1,
                        "UsedSpace": 1,
                        "MaxSpace": 1024,
                        "AddressIDs": [
                            "hCjg4nXWswD5EhdgWrKr2xP3D-99QRPot3H3hg7yBfLZ9GOrjBEJuc3-rO7u-0WevfX4WSFcfgps8O3qKJAZxQ==",
                            "kBZYBzgHWtjW5igU33BXqwVZ66GBdJi4ycXPzZjyUmp840-O2yXyNEO0ayRveZKNnASS_btzUY-WkI_mcvNuOg==",
                            "dRs2Vv64Vru392SbvvG1MbEt3Ep5P_EWz8WbHVAOl_6h_Ty9jItyktkVcfz9-xRvCGwFq_TW7i8FtJaGyFEq0g=="
                        ]
                    }
                ],
                "Code": 1000
            });

            return deferred.promise;
            // return $http.get(url.get() + '/members');
        },
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
