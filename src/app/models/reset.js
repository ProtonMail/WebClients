angular.module("proton.models.reset", [])

.factory("Reset", function($http, authentication) {
    return {
        // POST
        requestResetToken: function(Obj) {
            return $http.post(authentication.baseURL + '/reset', Obj);
        },
        resetPassword: function(Obj) {
            return $http.post(authentication.baseURL + '/reset/' + encodeURIComponent(Obj.Token), Obj);
        },
        getMailboxResetToken: function(Obj) {
            return $http.post(authentication.baseURL + '/reset/mailbox', Obj);
        },
        resetMailbox: function(Obj) {
            return $http.post(authentication.baseURL + '/reset/mailbox/' + encodeURIComponent(Obj.Token), Obj);
        },
        // GET
        validateResetToken: function(Obj) {
            return $http.get(authentication.baseURL + '/reset/' + encodeURIComponent(Obj.token));
        }
    };
});