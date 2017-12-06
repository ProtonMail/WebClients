/* @ngInject */
function Key($http, url, srp) {
    const requestUrl = url.build('keys');

    /**
     * Create a new key
     * @param {Object} params
     * @return {Promise}
     */
    const create = (params = {}) => $http.post(requestUrl(), params);

    /**
     * Install a new key for each address
     * @param {Object} params
     * @return {Promise}
     */
    const setup = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp.getPasswordParams(newPassword, params).then((authParams) => $http.post(requestUrl('setup'), authParams));
        }

        return $http.post(requestUrl('setup'), params);
    };

    /**
     * Install a new key for each address
     * @param {Object} params
     * @return {Promise}
     */
    const reset = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp.getPasswordParams(newPassword, params).then((authParams) => $http.post(requestUrl('reset'), authParams));
        }
        return $http.post(requestUrl('reset'), params);
    };
    /**
     * Update key priority
     * @param {Object} params
     * @return {Promise}
     */
    const order = (params = {}) => $http.post(requestUrl('order'), params);

    /**
     * Activate key
     * @param {String} keyID
     * @param {Object} params
     * @return {Promise}
     */
    const activate = (keyID, params = {}) => $http.put(requestUrl(keyID, 'activate'), params);

    /**
     * Update private key only, use for password updates
     * @param {Object} params
     * @return {Promise}
     */
    const privateKey = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp.getPasswordParams(newPassword, params).then((authParams) => $http.put(requestUrl('private'), authParams));
        }
        return $http.put(requestUrl('private'), params);
    };

    /**
     * Upgrade private key with incorrect metadata
     * @param {Object} params
     * @return {Promise}
     */
    const upgrade = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp.getPasswordParams(newPassword, params).then((authParams) => $http.put(requestUrl('private', 'upgrade'), authParams));
        }
        return $http.put(requestUrl('private', 'upgrade'), params);
    };

    /**
     * Delete key
     * @param {String} keyID
     * @return {Promise}
     */
    const deleteKey = (keyID) => $http.delete(requestUrl(keyID));

    /**
     * Get salts
     * @return {Promise}
     */
    const salts = () => $http.get(requestUrl('salts'));

    /**
     * Delete key
     * @param {String} keyID
     * @return {Promise}
     */
    const reactivate = (keyID, params) => $http.put(requestUrl(keyID), params);

    return {
        create,
        setup,
        reset,
        order,
        activate,
        upgrade,
        private: privateKey,
        delete: deleteKey,
        salts,
        reactivate
    };
}
export default Key;
