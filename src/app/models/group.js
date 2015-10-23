angular.module("proton.models.groups", [])

.factory("Group", function($http, $q, url) {
    return {
        // POST
        /**
         * Create a new group of given parameters. Requires a subscription.
         */
        create: function(Obj) {
            return $http.post(url.get() + '/groups', Obj);
        },
        //GET
        /**
         * Get group info: group name, token IDs, members (ids, names, roles, addresses, used space, space limit), domains (ids, names, verification status for MX, SPF, DKIM), usage and limits (for domains, members, addresses and space), billing info (status, billing cycle, next billing time). Only available for the group admin.
         */
        get: function() {
            var deferred = $q.defer();
            // return $http.get(url.get() + '/groups');
            deferred.resolve({
                "Group": {
                    "DisplayName": "E-Corp",
                    "MaxDomains": 1,
                    "MaxMembers": 5,
                    "MaxAddresses": 5,
                    "MaxSpace": 5120,
                    "Use2FA": true,
                    "BillingCycle": 12,
                    "NextPaymentTime": 1234567890,
                    "BillingStatus": 1,
                    "Members": [
                        {
                            "MemberID": "q6fRrEIn0nyJBE_-YSIiVf80M2VZhOuUHW5In4heCyOdV_nGibV38tK76fPKm7lTHQLcDiZtEblk0t55wbuw4w==",
                            "UserName": "max.mustermann",
                            "DisplayName": "Max Mustermann",
                            "NotificationEmail": "max123@gmail.com",
                            "Role": 0,
                            "UsedSpace": 1,
                            "MaxSpace": 1024,
                            "Addresses": [
                                {
                                    "AddressID": "UVhawo1URvrpvbnp1FaDO2RhoaENS5Ge8bJ4PT4U4ATqZeZTNGrVD1vM2JpeQP8tMMQQ9iqDEIz2u4werNZIRw==",
                                    "Email": "boss@e-corp.com",
                                    "DisplayName": "E-Corp CEO",
                                    "Send": 0
                                },
                                {
                                    "AddressID": "fT-fHNQexHafNYev4Qz49aetYhhjFOJCD8E8GYYOMY6o0U9WwINhnI76D9k7f6WB8_GaMISfd3a_cxe6vEUGxw==",
                                    "Email": "max.mustermann@e-corp.com",
                                    "DisplayName": "Max Mustermann",
                                    "Send": 1
                                }
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
                            "Addresses": [
                                {
                                    "AddressID": "hCjg4nXWswD5EhdgWrKr2xP3D-99QRPot3H3hg7yBfLZ9GOrjBEJuc3-rO7u-0WevfX4WSFcfgps8O3qKJAZxQ==",
                                    "Email": "elliot@e-corp.com",
                                    "DisplayName": "Elliot Alderson",
                                    "Send": 0
                                },
                                {
                                    "AddressID": "kBZYBzgHWtjW5igU33BXqwVZ66GBdJi4ycXPzZjyUmp840-O2yXyNEO0ayRveZKNnASS_btzUY-WkI_mcvNuOg==",
                                    "Email": "security@e-corp.com",
                                    "DisplayName": "Security",
                                    "Send": 1
                                },
                                {
                                    "AddressID": "dRs2Vv64Vru392SbvvG1MbEt3Ep5P_EWz8WbHVAOl_6h_Ty9jItyktkVcfz9-xRvCGwFq_TW7i8FtJaGyFEq0g==",
                                    "DisplayName": "Mr. Robot",
                                    "Email": "mr.r@fsociety.org",
                                    "Send": 2
                                }
                            ]
                        }
                    ]
                },
                "Code": 1000
            });
            return deferred.promise;
        },
        // PUT
        /**
         * Update group in a way that doesn't require a payment (name, billing cycle, tokens).
         */
        update: function(Obj) {
            return $http.put(url.get() + '/groups', Obj);
        },
        /**
         * Update group in a way that requires a payment.
         */
        payment: function(Obj) {
            return $http.put(url.get() + '/groups/payment', Obj);
        },
        // DELETE
        /**
         * Delete the group.
         */
        delete: function() {
            return $http.delete(url.get() + '/groups');
        }
    };
});
