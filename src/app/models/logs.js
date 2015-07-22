angular.module("proton.models.logs", [])

.factory("Logs", function($http, $rootScope) {
    return {
        // GET
        getLogs: function() {
            return $http.get($rootScope.baseURL + '/logs/auth');
        },
        // DELETE
        clearLogs: function(Obj) {
            return $http.delete($rootScope.baseURL + '/logs/auth');
        }
    };
});
