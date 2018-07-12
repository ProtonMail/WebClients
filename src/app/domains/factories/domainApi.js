/* @ngInject */
function domainApi($http, gettextCatalog, url) {
    const requestURL = url.build('domains');
    const I18N = {
        ERROR: gettextCatalog.getString('Domain request failed', null, 'Error')
    };
    const handleResult = ({ data = {} } = {}) => data;
    const handleError = (error) => ({ data = {} }) => {
        throw new Error(data.Error || error);
    };

    /**
     * Create a domain of a given name
     */
    const create = (params) =>
        $http
            .post(requestURL(), params)
            .then(handleResult)
            .catch(handleError(I18N.ERROR));
    /**
     * Get all domains for this user's organization and check their DNS's
     */
    const query = () =>
        $http
            .get(requestURL())
            .then(handleResult)
            .catch(handleError(I18N.ERROR));
    /**
     * Return the list of domains available during the signing process
     */
    const available = () =>
        $http
            .get(requestURL('available'))
            .then(handleResult)
            .catch(handleError(I18N.ERROR));
    /**
     * Get premium domains
     */
    const premium = () =>
        $http
            .get(requestURL('premium'))
            .then(handleResult)
            .catch(handleError(I18N.ERROR));
    /**
     * Set a catch-all address for a domain
     * This allowed users on appropriate plans to designate a single address on a custom domain as their 'catch-all' address, which will receive all mail sent to their domain which does not correspond to another address they have set up.
     */
    const catchall = (id, params) =>
        $http
            .put(requestURL(id, 'catchall'), params)
            .then(handleResult)
            .catch(handleError(I18N.ERROR));
    /**
     * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
     */
    const get = (id) =>
        $http
            .get(requestURL(id))
            .then(handleResult)
            .catch(handleError(I18N.ERROR));
    const destroy = (id) =>
        $http
            .delete(requestURL(id))
            .then(handleResult)
            .catch(handleError(I18N.ERROR));
    const addresses = (id) =>
        $http
            .get(requestURL(id, 'addresses'))
            .then(handleResult)
            .catch(handleError(I18N.ERROR));

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
