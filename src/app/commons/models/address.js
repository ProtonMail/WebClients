/* @ngInject */
function Address($http, url, gettextCatalog) {
    const I18N = {
        ERROR_UPDATE: gettextCatalog.getString('Error during updating', null, 'Error'),
        ERROR_ORDER: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'),
        ERROR_DELETE: gettextCatalog.getString('Error during deletion', null, 'Error'),
        ERROR_DISABLE: gettextCatalog.getString('Error during disable request', null, 'Error'),
        ERROR_ENABLE: gettextCatalog.getString('Error during enable request', null, 'Error'),
        ERROR_CREATE: gettextCatalog.getString('Address creation failed', null, 'Error'),
        ERROR_QUERY: gettextCatalog.getString('Error during query addresses', null, 'Error'),
        ERROR_GET: gettextCatalog.getString('Error during get address', null, 'Error')
    };

    const requestUrl = url.build('addresses');
    const handleResult = ({ data = {} } = {}) => data;
    const filterError = (error) => ({ data = {} }) => {
        throw new Error(data.Error || error);
    };

    /**
     * Add an address to a domain, returns {address_id} if successful, group address limit and usage
     * @param {Object} address
     * @return {Promise}
     */
    const create = (address) => {
        return $http
            .post(requestUrl(), address)
            .then(handleResult)
            .catch(filterError(I18N.ERROR_CREATE));
    };

    /**
     * Add an address to a domain, returns {address_id} if successful, group address limit and usage
     * @param {Object} address
     * @return {Promise}
     */
    const setup = (params) => {
        return $http.post(requestUrl('setup'), params);
    };

    /**
     * Edit address
     * @param {String} addressID
     * @param {Object} params
     * @return {Promise}
     */
    const edit = (addressID, params) => {
        return $http
            .put(requestUrl(addressID), params)
            .then(handleResult)
            .catch(filterError(I18N.ERROR_UPDATE));
    };

    /**
     * Enable address
     * @param {String} addressID
     * @return {Promise}
     */
    const enable = (addressID) => {
        return $http
            .put(requestUrl(addressID, 'enable'))
            .then(handleResult)
            .catch(filterError(I18N.ERROR_ENABLE));
    };

    /**
     * Disable address
     * @param {String} addressID
     * @return {Promise}
     */
    const disable = (addressID) => {
        return $http
            .put(requestUrl(addressID, 'disable'))
            .then(handleResult)
            .catch(filterError(I18N.ERROR_DISABLE));
    };

    /**
     * Delete an address (alias), returns group address limit and usage
     * @param {String} addressID
     * @return {Promise}
     */
    const remove = (addressID) => {
        return $http
            .delete(requestUrl(addressID))
            .then(handleResult)
            .catch(filterError(I18N.ERROR_DELETE));
    };

    const order = (params) => {
        return $http
            .put(requestUrl('order'), params)
            .then(handleResult)
            .catch(filterError(I18N.ERROR_ORDER));
    };

    const query = () =>
        $http
            .get(requestUrl())
            .then(handleResult)
            .then((data) => data.Addresses)
            .catch(filterError(I18N.ERROR_QUERY));
    const get = (addressID) =>
        $http
            .get(requestUrl(addressID))
            .then(handleResult)
            .catch(filterError(I18N.ERROR_GET));

    return { create, setup, edit, enable, disable, remove, order, query, get };
}
export default Address;
