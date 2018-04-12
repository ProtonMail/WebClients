import { RECIPIENT_TYPE } from '../../constants';

const KEY_GET_ADDRESS_MISSING = 33102;
const KEY_GET_ADDRESS_NO_RECEIVE = 33103;

/* @ngInject */
function Key($http, url, srp) {
    const requestURL = url.build('keys');

    /**
     * Get public keys of the given emails addresses
     * @return {Promise}
     */
    const keys = (Email, Fingerprint = null) => {
        return $http
            .get(requestURL(), { params: { Email, Fingerprint } })
            .then(({ data = {} }) => data)
            .catch((e) => {
                const { data } = e;

                if (!data) {
                    throw e;
                }

                if (data.Code === KEY_GET_ADDRESS_MISSING || data.Code === KEY_GET_ADDRESS_NO_RECEIVE) {
                    return {
                        RecipientType: RECIPIENT_TYPE.TYPE_NO_RECEIVE,
                        MIMEType: null,
                        Keys: []
                    };
                }
            });
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
     * @param {Object} params
     * @return {Promise}
     */
    const setup = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp
                .getPasswordParams(newPassword, params)
                .then((authParams) => $http.post(requestURL('setup'), authParams));
        }

        return $http.post(requestURL('setup'), params);
    };
    /**
     * Install a new key for each address
     * @param {Object} params
     * @return {Promise}
     */
    const reset = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp
                .getPasswordParams(newPassword, params)
                .then((authParams) => $http.post(requestURL('reset'), authParams));
        }
        return $http.post(requestURL('reset'), params);
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
     * @param {Object} params
     * @return {Promise}
     */
    const updatePrivate = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp
                .getPasswordParams(newPassword, params)
                .then((authParams) => $http.put(requestURL('private'), authParams));
        }
        return $http.put(requestURL('private'), params);
    };
    /**
     * Upgrade private key with incorrect metadata
     * @param {Object} params
     * @return {Promise}
     */
    const upgrade = (params = {}, newPassword = '') => {
        if (newPassword.length) {
            return srp
                .getPasswordParams(newPassword, params)
                .then((authParams) => $http.put(requestURL('private', 'upgrade'), authParams));
        }
        return $http.put(requestURL('private', 'upgrade'), params);
    };
    /**
     * Make a private key primary, only for activated keys
     * @param {String} keyID
     * @return {Promise}
     */
    const primary = (keyID) => {
        return $http.put(requestURL(keyID, 'primary'));
    };
    /**
     * Delete key
     * @param {String} keyID
     * @return {Promise}
     */
    const remove = (keyID) => {
        return $http.delete(requestURL(keyID));
    };
    /**
     * Get salts
     * @return {Promise}
     */
    const salts = () => {
        return $http.get(requestURL('salts'));
    };
    /**
     * reactive key
     * @param {String} keyID
     * @return {Promise}
     */
    const reactivate = (keyID, params) => $http.put(requestURL(keyID), params);

    return { keys, create, setup, reset, primary, activate, updatePrivate, upgrade, remove, salts, reactivate };
}
export default Key;
