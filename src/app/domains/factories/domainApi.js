angular.module('proton.domains')
.factory('domainApi', ($http, url) => {
    const requestURL = url.build('domains');

    /**
     * Create a domain of a given name
     */
    const create = (Obj) => $http.post(requestURL(), Obj);
    /**
     * Get all domains for this user's organization and check their DNS's
     */
    const query = () => $http.get(requestURL());
    /**
    * Return the list of domains available during the signing process
    */
    const available = () => $http.get(requestURL('available'));
    /**
     * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
     */
    const get = (id) => $http.get(requestURL(id));
    const destroy = (id) => $http.delete(requestURL(id));

    return {
        delete: destroy,
        create, query, available, get
    };
});
