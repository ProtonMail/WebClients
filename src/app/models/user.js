angular.module('proton.models.user', [])
.factory('User', ($http, url, srp) => {
    return {
        create(params, password) {
            return srp.getPasswordParams(password, params)
            .then((data) => $http.post(url.get() + '/users', data));
        },
        code(params) {
            return $http.post(url.get() + '/users/code', params);
        },
        get() {
            return $http.get(url.get() + '/users');
        },
        pubkeys(emails) {
            return $http.get(url.get() + '/users/pubkeys/' + window.encodeURIComponent(emails));
        },
        available(username) {
            return $http.get(url.get() + '/users/available/' + username);
        },
        direct() {
            return $http.get(url.get() + '/users/direct');
        },
        lock() {
            return $http.put(url.get() + '/users/lock');
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
});
