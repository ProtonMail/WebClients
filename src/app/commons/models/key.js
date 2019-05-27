/* @ngInject */
function Key($http, url, srp) {
    const requestURL = url.build('keys');

    const unload = ({ data }) => data;

    /**
     * Get public keys of the given emails addresses
     * @return {Promise}
     */
    const keys = (params = {}) => {
        return $http.get(requestURL(), params).then(unload);
    };

    /**
     * Create a new key
     * @param {Object} params
     * @return {Promise}
     */
    const create = (params = {}) => {
        return $http.post(requestURL(), params);
    };
    /**
     * Install a new key for each address
     * @param {Object} data
     * @param {String} [Password]
     * @return {Promise}
     */
    const setup = (data = {}, Password = '') => {
        if (Password.length) {
            return srp.verify.post({ Password }, requestURL('setup'), data);
        }

        return $http.post(requestURL('setup'), data);
    };
    /**
     * Install a new key for each address
     * @param {Object} data
     * @param {String} [Password]
     * @return {Promise}
     */
    const reset = (data = {}, Password = '') => {
        if (Password.length) {
            return srp.verify.post({ Password }, requestURL('reset'), data);
        }
        return $http.post(requestURL('reset'), data);
    };
    /**
     * Activate key
     * @param {String} keyID
     * @param {Object} params
     * @return {Promise}
     */
    const activate = (keyID, params = {}) => $http.put(requestURL(keyID, 'activate'), params);
    /**
     * Update private key only, use for password updates
     * @param {Object} data
     * @param {String} [Password]
     * @return {Promise}
     */
    const updatePrivate = (data = {}, Password = '') => {
        if (Password.length) {
            return srp.verify.put({ Password }, requestURL('private'), data);
        }
        return $http.put(requestURL('private'), data);
    };
    /**
     * Upgrade private key with incorrect metadata
     * @param {Object} data
     * @param {String} [Password]
     * @return {Promise}
     */
    const upgrade = (data = {}, Password = '') => {
        if (Password.length) {
            return srp.verify.post({ Password }, requestURL('private', 'upgrade'), data);
        }
        return $http.post(requestURL('private', 'upgrade'), data);
    };
    /**
     * Make a private key primary, only for activated keys
     * @param {String} keyID
     * @param {Object} params
     * @return {Promise}
     */
    const primary = (keyID, params) => {
        return $http.put(requestURL(keyID, 'primary'), params);
    };
    /**
     * Delete key
     * @param {String} keyID
     * @param {Object} params
     * @return {Promise}
     */
    const remove = (keyID, params) => {
        return $http.put(requestURL(keyID, 'delete'), params);
    };
    /**
     * Get salts
     * @return {Promise}
     */
    const salts = () => {
        return $http.get(requestURL('salts')).then(unload);
    };
    /**
     * Update the key flags
     * @param {String} keyID
     * @param {Integer} params.Flags (bitmask: bit 0 enables verification, bit 1 enables encryption)
     * @param {Object} params.SignedKeyList
     * @return {Promise}
     */
    const flags = (keyID, params) => {
        return $http.put(requestURL(keyID, 'flags'), params);
    };
    /**
     * reactive key
     * @param {String} keyID
     * @return {Promise}
     */
    const reactivate = (keyID, params) => $http.put(requestURL(keyID), params);

    return { keys, create, setup, reset, primary, activate, updatePrivate, upgrade, remove, salts, reactivate, flags };
}
export default Key;
