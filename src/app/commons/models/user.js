/* @ngInject */
function User($http, url, srp) {
    const headersVersion3 = { 'x-pm-apiversion': 3 };
    const requestURL = url.build('users');

    return {
        create(params, password) {
            return srp.getPasswordParams(password, params).then((data) => $http.post(requestURL(), data));
        },
        code(params) {
            return $http.post(requestURL('code'), params);
        },
        get() {
            return $http.get(requestURL(), {
                headers: headersVersion3
            });
        },
        human() {
            return $http.get(url.get() + '/users/human');
        },
        check(params) {
            return $http.post(url.get() + '/users/human', params);
        },
        pubkeys(emails) {
            return $http.get(requestURL('pubkeys', window.encodeURIComponent(emails)));
        },
        available(username) {
            return $http.get(requestURL('available', username));
        },
        direct() {
            return $http.get(requestURL('direct'));
        },
        lock() {
            return $http.put(requestURL('lock'));
        },
        unlock(creds = {}) {
            return srp.performSRPRequest('PUT', '/users/unlock', {}, creds);
        },
        password(creds = {}) {
            return srp.performSRPRequest('PUT', '/users/password', {}, creds);
        },
        delete(creds = {}) {
            return srp.performSRPRequest('PUT', '/users/delete', {}, creds);
        }
    };
}
export default User;
