angular.module("proton.models.logs", [])

.factory("Logs", function($http, authentication) {
    return {
        // GET
        getLogs: function() {
            return $http.get(authentication.baseURL + '/logs/auth');
        },
        // DELETE
        clearLogs: function(Obj) {
            return $http.delete(authentication.baseURL + '/logs/auth');
        }
    };
});
