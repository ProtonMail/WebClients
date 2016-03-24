angular.module('proton.models.user', [])

.factory('User', function($http, url) {
    var User = {
        create: function(params) {
            return $http.post(url.get() + '/users/:token', params);
        },
        code: function(params) {
            return $http.post(url.get() + '/users/code', params);
        },
        get: function() {
            return $http.get(url.get() + '/users');
        },
        pubkeys: function(emails) {
            return $http.get(url.get() + '/users/pubkeys/' + emails);
        },
        available: function(username) {
            return $http.get(url.get() + '/users/available/' + username);
        },
        direct: function() {
            return $http.get(url.get() + '/users/direct');
        },
        unlock: function(params) {
            return $http.put(url.get() + '/users/unlock', params);
        },
        delete: function() {
            return $http.put(url.get() + '/users/delete');
        }
    };

    return User;
});
