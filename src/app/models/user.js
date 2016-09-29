angular.module('proton.models.user', ["proton.srp"])

.factory('User', function($http, url, srp) {
    var User = {
        create: function(params, password) {
            return srp.randomVerifier(password).then(function(pass_params) {
                return $http.post(url.get() + '/users', _.extend(params, pass_params));
            });
        },
        code: function(params) {
            return $http.post(url.get() + '/users/code', params);
        },
        get: function() {
            return $http.get(url.get() + '/users');
        },
        pubkeys: function(emails) {
            return $http.get(url.get() + '/users/pubkeys/' + window.encodeURIComponent(emails));
        },
        available: function(username) {
            return $http.get(url.get() + '/users/available/' + username);
        },
        direct: function() {
            return $http.get(url.get() + '/users/direct');
        },
        unlock: function(params) {
            return srp.performSRPRequest("PUT", '/users/unlock', {}, params);
        },
        delete: function(params) {
            return srp.performSRPRequest("PUT", '/users/delete', {}, params);
        }
    };

    return User;
});
