/* @ngInject */
function domainApi($http, url) {
    const requestURL = url.build('domains');

    const handleResult = ({ data = {} } = {}) => data;

    /**
     * Create a domain of a given name
     */
    const create = (params) => $http.post(requestURL(), params).then(handleResult);
    /**
     * Get all domains for this user's organization and check their DNS's
     */
    const query = () => $http.get(requestURL()).then(handleResult);
    /**
     * Return the list of domains available during the signing process
     */
    const available = (params) => $http.get(requestURL('available'), params).then(handleResult);
    /**
     * Get premium domains
     */
    const premium = () => $http.get(requestURL('premium')).then(handleResult);
    /**
     * Set a catch-all address for a domain
     * This allowed users on appropriate plans to designate a single address on a custom domain as their 'catch-all' address, which will receive all mail sent to their domain which does not correspond to another address they have set up.
     */
    const catchall = (id, params) => $http.put(requestURL(id, 'catchall'), params).then(handleResult);

    /**
     * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
     */
    const get = (id) => $http.get(requestURL(id)).then(handleResult);

    const destroy = (id) => $http.delete(requestURL(id)).then(handleResult);

    const addresses = (id) => $http.get(requestURL(id, 'addresses')).then(handleResult);

    return {
        addresses,
        delete: destroy,
        create,
        query,
        available,
        premium,
        get,
        catchall
    };
}
export default domainApi;
