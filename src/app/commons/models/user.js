/* @ngInject */
function User($http, url, srp) {
    const requestURL = url.build('users');

    const create = (data, Password) => srp.verify.post({ Password }, requestURL(), data);
    const get = (config = {}) => $http.get(requestURL(), config).then(({ data = {} } = {}) => data.User);
    const code = (params) => $http.post(requestURL('code'), params);
    const human = () => $http.get(requestURL('human'));
    const verifyHuman = (params) => $http.post(requestURL('human'), params);
    const check = () => (params) => $http.put(requestURL('check'), params);
    const direct = () => $http.get(requestURL('direct'));
    const lock = () => $http.put(requestURL('lock'));
    const available = (params, config) => $http.get(requestURL('available'), params, config);

    const unlock = (credentials) => srp.auth.put(credentials, requestURL('unlock'));
    const password = (credentials) => srp.auth.put(credentials, requestURL('password'));
    const remove = (data) => $http.put(requestURL('delete'), data);
    const canDelete = () => $http.get(requestURL('delete'));

    return {
        requestURL,
        available,
        create,
        get,
        code,
        human,
        verifyHuman,
        check,
        direct,
        lock,
        unlock,
        password,
        delete: remove,
        canDelete
    };
}
export default User;
