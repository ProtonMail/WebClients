/* @ngInject */
function User($http, url, srp) {
    const headersVersion3 = { 'x-pm-apiversion': 3 };
    const requestURL = url.build('users');

    const toSRP = (type, scope, creds, data = {}) => {
        return srp.performSRPRequest(type, `/users/${scope}`, data, creds);
    };

    const create = (params, password) => {
        return srp.getPasswordParams(password, params).then((data) => $http.post(requestURL(), data));
    };

    const get = () => {
        return $http
            .get(requestURL(), {
                header: headersVersion3
            })
            .then(({ data = {} } = {}) => data.User);
    };

    const code = (params) => $http.post(requestURL('code'), params);
    const human = () => $http.get(requestURL('human'));
    const check = (params) => $http.post(requestURL('human'), params);
    const direct = () => $http.get(requestURL('direct'));
    const lock = () => $http.put(requestURL('lock'));
    const unlock = (creds = {}) => toSRP('PUT', 'unlock', creds);
    const password = (creds = {}) => toSRP('PUT', 'password', creds);
    const remove = (creds = {}) => toSRP('PUT', 'delete', creds);
    const available = (params) => $http.get(requestURL('available'), params);

    return {
        available,
        create,
        get,
        code,
        human,
        check,
        direct,
        lock,
        unlock,
        password,
        delete: remove
    };
}
export default User;
