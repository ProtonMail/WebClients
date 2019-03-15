/* @ngInject */
function Address($http, url) {

    const requestUrl = url.build('addresses');

    const handleResult = ({ data = {} } = {}) => data;

    /**
     * Add an address to a domain, returns {address_id} if successful, group address limit and usage
     * @param {Object} address
     * @return {Promise}
     */
    const create = (address) => $http.post(requestUrl(), address).then(handleResult);

    /**
     * Add an address to a domain, returns {address_id} if successful, group address limit and usage
     * @param {Object} address
     * @return {Promise}
     */
    const setup = (params) => $http.post(requestUrl('setup'), params);

    /**
     * Edit address
     * @param {String} addressID
     * @param {Object} params
     * @return {Promise}
     */
    const edit = (addressID, params) => $http.put(requestUrl(addressID), params).then(handleResult);

    /**
     * Enable address
     * @param {String} addressID
     * @return {Promise}
     */
    const enable = (addressID) => $http.put(requestUrl(addressID, 'enable')).then(handleResult);

    /**
     * Disable address
     * @param {String} addressID
     * @return {Promise}
     */
    const disable = (addressID) => $http.put(requestUrl(addressID, 'disable')).then(handleResult);

    /**
     * Delete an address (alias), returns group address limit and usage
     * @param {String} addressID
     * @return {Promise}
     */
    const remove = (addressID) => $http.delete(requestUrl(addressID)).then(handleResult);

    const order = (params) => $http.put(requestUrl('order'), params).then(handleResult);

    const query = () =>
        $http
            .get(requestUrl())
            .then(handleResult)
            .then((data) => data.Addresses);

    const get = (addressID) => $http.get(requestUrl(addressID)).then(handleResult);

    return { create, setup, edit, enable, disable, remove, order, query, get };
}
export default Address;
