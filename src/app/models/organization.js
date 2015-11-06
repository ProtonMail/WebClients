angular.module("proton.models.organization", [])

.factory("Organization", function($http, $q, url) {
    return {
        // POST
        /**
         * Create a new group of given parameters. Requires a subscription.
         */
        create: function(Obj) {
            return $http.post(url.get() + '/organizations', Obj);
        },
        //GET
        /**
         * Get group info: group name, token IDs, members (ids, names, roles, addresses, used space, space limit), domains (ids, names, verification status for MX, SPF, DKIM), usage and limits (for domains, members, addresses and space), billing info (status, billing cycle, next billing time). Only available for the group admin.
         */
        get: function() {
            // return $http.get(url.get() + '/organizations');
            var deferred = $q.defer();

            deferred.resolve({
                "Organization": {
                    "DisplayName": "E-Corp",
                    "MaxDomains": 1,
                    "MaxMembers": 5,
                    "MaxAddresses": 5,
                    "MaxSpace": 5120,
                    "Use2FA": true,
                    "UsedDomains": 1,
                    "UsedMembers": 2,
                    "UsedAddresses": 5,
                    "UsedSpace": 314,
                    "BillingCycle": 12,
                    "NextPaymentTime": 1234567890,
                    "BillingStatus": 1,
                    "MemberIDs": [
                        "q6fRrEIn0nyJBE_-YSIiVf80M2VZhOuUHW5In4heCyOdV_nGibV38tK76fPKm7lTHQLcDiZtEblk0t55wbuw4w==",
                        "0WjWEbOmKh7F2a1Snx2FJKA7a3Fm05p-nIZ0TqiHjDDUa6oHnsyWeeVXgSuzumCmFE8_asJsom9ZzGbx-eDecw=="
                    ],
                    "DomainIDs": [
                        "dw-RwOdh4DWxBXnVoGO48PV_qEfG5T_j0fph6fSEBYetVdpX4v9ReAlusIcj7GUazufLnMTa0cOTvWCF7qWX3g=="
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
            return $http.put(url.get() + '/organizations', Obj);
        },
        /**
         * Update group in a way that requires a payment.
         */
        payment: function(Obj) {
            return $http.put(url.get() + '/organizations/payment', Obj);
        },
        // DELETE
        /**
         * Delete the group.
         */
        delete: function() {
            return $http.delete(url.get() + '/organizations');
        }
    };
});
