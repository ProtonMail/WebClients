/* @ngInject */
function memberApi($http, url, srp) {
    const requestUrl = url.build('members');
    const requestSrp = url.make('members');

    const handleResult = ({ data = {} } = {}) => data;

    /**
     * Add a member to a group. This creates a new user. Returns the new {member_id} if successful.
     */
    const create = (Obj, password) => {
        return srp
            .getPasswordParams(password, Obj)
            .then((data) => $http.post(requestUrl(), data))
            .then(handleResult);
    };

    /**
     * Authenticate on behalf of a member to view her inbox.
     * @param {String} memberID
     * @param {Object} params
     * @return {Promise}
     */
    const authenticate = (memberID, params) => {
        return srp
            .performSRPRequest('POST', requestSrp(memberID, 'auth'), {}, params)
            .then(({ data = {} }) => data.UID);
    };

    const query = () => {
        return $http.get(requestUrl()).then(handleResult);
    };

    /**
     * Get member info, including UserID and key pair.
     */
    const get = (memberID) => $http.get(requestUrl(memberID));

    /**
     * Update member name
     * @param {String} memberID
     * @param {String} name
     * @return {Promise}
     */
    const name = (memberID, Name) => {
        return $http.put(requestUrl(memberID, 'name'), { Name }).then(handleResult);
    };

    /**
     * Update disk space quota in bytes
     * @param {String} memberID
     * @param {Integer} space
     * @return {Promise}
     */
    const quota = (memberID, MaxSpace) => {
        return $http.put(requestUrl(memberID, 'quota'), { MaxSpace }).then(handleResult);
    };

    /**
     * Update vpn allocated
     * @param {String} memberID
     * @param {Integer} space
     * @return {Promise}
     */
    const vpn = (memberID, MaxVPN) => {
        return $http.put(requestUrl(memberID, 'vpn'), { MaxVPN }).then(handleResult);
    };

    /**
     * Update role
     * @param {String} memberID
     * @param {Object} params
     * @return {Promise}
     */
    const role = (memberID, params) => {
        return $http.put(requestUrl(memberID, 'role'), params).then(handleResult);
    };

    /**
     * Update login password
     * @param {String} memberID
     * @param {String} password
     * @return {Promise}
     */
    const password = (memberID, password) => {
        return srp.getPasswordParams(password).then((data) => $http.post(requestUrl(memberID, 'password'), data));
    };

    /**
     * Make account private
     * @param {String} memberID
     * @return {Promise}
     */
    const privatize = (memberID) => {
        return $http.put(requestUrl(memberID, 'privatize')).then(handleResult);
    };

    /**
     * Nuke the member. Protect against nuking the group owner.
     */
    const remove = (memberID) => {
        return $http.delete(requestUrl(memberID)).then(handleResult);
    };

    /**
     * Revoke token.
     */
    const revoke = () => $http.delete(requestUrl('auth'));
    const addresses = (memberID) => $http.get(requestUrl(memberID, 'addresses'));
    const createKey = (memberID, params) => $http.post(requestUrl(memberID, 'keys'), params);
    const updateKey = (memberID, keyID, params) => $http.put(requestUrl(memberID, 'keys', keyID), params);
    const primaryKey = (memberID, keyID) => $http.put(requestUrl(memberID, 'keys', keyID, 'primary'));
    const deleteKey = (memberID, keyID) => $http.delete(requestUrl(memberID, 'keys', keyID));
    const setupKey = (memberID, passParams, params) => {
        return srp.randomVerifier(passParams).then((passParams) => {
            return $http.post(requestUrl(memberID, 'keys', 'setup'), { ...params, ...passParams });
        });
    };

    return {
        addresses,
        authenticate,
        create,
        createKey,
        deleteKey,
        get,
        name,
        password,
        primaryKey,
        privatize,
        query,
        quota,
        remove,
        revoke,
        role,
        setupKey,
        updateKey,
        vpn
    };
}
export default memberApi;
