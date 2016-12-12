angular.module('proton.models.organization', [])

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
         * Get organization keys
         */
        getKeys() {
            return $http.get(url.get() + '/organizations/keys');
        },
        /**
         * Get organization keys
         */
        getBackupKeys() {
            return $http.get(url.get() + '/organizations/keys/backup');
        },
        // PUT
        /**
         * Update private key for the organization
         */
        activateKeys(Obj) {
            return $http.put(url.get() + '/organizations/keys/activate', Obj);
        },
        /**
         * Replace private key for the organization
         */
        replaceKeys(Obj, creds) {
            return srp.performSRPRequest('PUT', '/organizations/keys', Obj, creds);
        },
        /**
         * Get organization keys
         */
        updateBackupKeys(Obj, creds) {
            return srp.performSRPRequest('PUT', '/organizations/keys/backup', Obj, creds);
        }
    };
});
