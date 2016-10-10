angular.module('proton.models.organization', ['proton.srp'])

.factory('Organization', ($http, $q, url, srp) => {
    return {
        // POST
        /**
         * Create a new group of given parameters. Requires a subscription.
         */
        create(Obj) {
            return $http.post(url.get() + '/organizations', Obj);
        },
        // GET
        /**
         * Get group info: group name, token IDs, members (ids, names, roles, addresses, used space, space limit), domains (ids, names, verification status for MX, SPF, DKIM), usage and limits (for domains, members, addresses and space), billing info (status, billing cycle, next billing time). Only available for the group admin.
         * @param {Object}
         */
        get() {
            return $http.get(url.get() + '/organizations', {
                transformResponse(data) {
                    const json = angular.fromJson(data) || {};

                    if (json.Code === 21001) {
                        json.Code = 1000;
                        json.Organization = null;
                    }

                    return json;
                }
            });
        },
        /**
         *
         */
        getKeys() {
            return $http.get(url.get() + '/organizations/keys');
        },
        // PUT
        /**
         * Update group in a way that doesn't require a payment (name, billing cycle, tokens).
         */
        update(Obj) {
            return $http.put(url.get() + '/organizations', Obj);
        },
        /**
         * Update private key for the organization
         */
        private(Obj, creds) {
            return srp.performSRPRequest('PUT', '/organizations/keys/private', Obj, creds);
        },
        /**
         * Update group in a way that requires a payment.
         */
        payment(Obj) {
            return $http.put(url.get() + '/organizations/payment', Obj);
        }
    };
});
