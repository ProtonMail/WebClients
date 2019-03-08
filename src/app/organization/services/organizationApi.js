/* @ngInject */
function organizationApi($http, gettextCatalog, url, srp) {
    const requestURL = url.build('organizations');

    /**
     * Get group info: group name, token IDs, members (ids, names, roles, addresses, used space, space limit), domains (ids, names, verification status for MX, SPF, DKIM), usage and limits (for domains, members, addresses and space), billing info (status, billing cycle, next billing time). Only available for the group admin.
     * @return {Promise}
     */
    const get = () => $http.get(requestURL());

    /**
     * Get organization keys
     * @return {Promise}
     */
    const getKeys = () => $http.get(requestURL('keys'));

    /**
     * Get organization keys
     * @return {Promise}
     */
    const getBackupKeys = () => $http.get(requestURL('keys', 'backup'));

    /**
     * Update private key for the organization
     * @param {Object} params
     * @return {Promise}
     */
    const activateKeys = (params) => $http.put(requestURL('keys', 'activate'), params);

    /**
     * Replace private key for the organization
     * @param {Object} credentials
     * @param {Object} data
     * @return {Promise}
     */
    const replaceKeys = (credentials, data) => srp.auth.put(credentials, requestURL('keys'), data);

    /**
     * Replace current organization keys and member keys
     * @param {Object} params
     * @return {Promise}
     */
    const updateOrganizationKeys = (params) => $http.put(requestURL('keys'), params);

    /**
     * Get organization keys
     * @param {Object} credentials
     * @param {Object} data
     * @return {Promise}
     */
    const updateBackupKeys = (credentials, data) => srp.auth.put(credentials, requestURL('keys', 'backup'), data);

    /**
     * Update organization name
     * @param {Object} params
     * @return {Promise}
     */
    const updateOrganizationName = (params) => $http.put(requestURL('name'), params);

    return {
        get,
        getKeys,
        getBackupKeys,
        activateKeys,
        replaceKeys,
        updateOrganizationKeys,
        updateBackupKeys,
        updateOrganizationName
    };
}
export default organizationApi;
