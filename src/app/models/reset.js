angular.module("proton.models.reset", [])

.factory("Reset", function($http, $rootScope) {
    return {
        // POST
        requestResetToken: function(Obj) {
            return $http.post($rootScope.baseURL + '/reset', Obj);
        },
        resetPassword: function(Obj) {
            return $http.post($rootScope.baseURL + '/reset/' + encodeURIComponent(Obj.Token), Obj);
        },
        getMailboxResetToken: function(Obj) {
            return $http.post($rootScope.baseURL + '/reset/mailbox', Obj);
        },
        resetMailbox: function(Obj) {
            return $http.post($rootScope.baseURL + '/reset/mailbox/' + encodeURIComponent(Obj.Token), Obj);
        },
        // GET
        validateResetToken: function(Obj) {
            return $http.get($rootScope.baseURL + '/reset/' + Obj.username + '/' + encodeURIComponent(Obj.token));
        }
    };
});
