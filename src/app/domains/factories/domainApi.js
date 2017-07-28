angular.module('proton.domains')
    .factory('domainApi', ($http, url) => {
        const requestURL = url.build('domains');

        /**
    * Create a domain of a given name
    */
        const create = (params) => $http.post(requestURL(), params);
        /**
    * Get all domains for this user's organization and check their DNS's
    */
        const query = () => $http.get(requestURL());
        /**
    * Return the list of domains available during the signing process
    */
        const available = () => $http.get(requestURL('available'));
        /**
     * Set a catch-all address for a domain
     * This allowed users on appropriate plans to designate a single address on a custom domain as their 'catch-all' address, which will receive all mail sent to their domain which does not correspond to another address they have set up.
     */
        const catchall = (domainID, params) => $http.put(requestURL(domainID, 'catchall'), params);
        /**
    * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
    */
        const get = (id) => $http.get(requestURL(id));
        const destroy = (id) => $http.delete(requestURL(id));

        return {
            delete: destroy,
            create, query, available, get,
            catchall
        };
    });
