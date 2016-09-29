angular.module("proton.models.reset", ['proton.srp'])

.factory("Reset", function($http, url, srp) {
    return {
        // POST
        requestResetToken: function(params = {}) {
            return $http.post(url.get() + '/reset', params);
        },
        resetPassword: function(params = {}, newPassword = '') {
            return srp.randomVerifier(newPassword).then(function(auth_params) {
                return $http.post(url.get() + '/reset/' + encodeURIComponent(params.Token), _.extend(params,auth_params));
            });
        },
        getMailboxResetToken: function(params = {}) {
            return $http.post(url.get() + '/reset/mailbox', params);
        },
        resetMailbox: function(params = {}) {
            return $http.post(url.get() + '/reset/mailbox/' + encodeURIComponent(params.Token), params);
        },
        // GET
        validateResetToken: function(params = {}) {
            return $http.get(url.get() + '/reset/' + params.Username + '/' + encodeURIComponent(params.Token));
        }
    };
});
