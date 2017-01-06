angular.module('proton.models.organization', [])

.factory('Organization', ($http, $q, authentication, url, srp) => {
    return {
        /**
         * Create a new group of given parameters. Requires a subscription.
         * @param {Object} params
         * @return {Promise}
         */
        create(params) {
            return $http.post(url.get() + '/organizations', params);
        },
        /**
         * Get group info: group name, token IDs, members (ids, names, roles, addresses, used space, space limit), domains (ids, names, verification status for MX, SPF, DKIM), usage and limits (for domains, members, addresses and space), billing info (status, billing cycle, next billing time). Only available for the group admin.
         * @return {Promise}
         */
        get() {
            if (authentication.user.Role === 2) {
                return $http.get(url.get() + '/organizations');
            }
            const fakeResult = {
                data: {
                    Code: 1000,
                    Organization: {
                        PlanName: 'free',
                        MaxMembers: 1,
                        HasKeys: 0
                    }
                }
            };
            return Promise.resolve(fakeResult);
        },
        /**
         * Get organization keys
         * @return {Promise}
         */
        getKeys() {
            return $http.get(url.get() + '/organizations/keys');
        },
        /**
         * Get organization keys
         * @return {Promise}
         */
        getBackupKeys() {
            return $http.get(url.get() + '/organizations/keys/backup');
        },
        /**
         * Update private key for the organization
         * @param {Object} params
         * @return {Promise}
         */
        activateKeys(params) {
            return $http.put(url.get() + '/organizations/keys/activate', params);
        },
        /**
         * Replace private key for the organization
         * @param {Object} params
         * @param {Object} creds
         * @return {Promise}
         */
        replaceKeys(params, creds) {
            return srp.performSRPRequest('PUT', '/organizations/keys', params, creds);
        },

        /**
         * Replace current organization keys and member keys
         * @param {Object} params
         * @return {Promise}
         */
        updateOrganizationKeys(params) {
            return $http.put('/organization/keys', params);
        },

        /**
         * Get organization keys
         * @param {Object} params
         * @param {Object} creds
         * @return {Promise}
         */
        updateBackupKeys(params, creds) {
            return srp.performSRPRequest('PUT', '/organizations/keys/backup', params, creds);
        },
        /**
         * Update organization name
         * @param {Object} params
         * @return {Promise}
         */
        updateOrganizationName(params) {
            return $http.put(url.get() + '/organizations/name', params);
        }
    };
});
