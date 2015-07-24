angular.module("proton.models.logs", [])

.factory("Logs", function($http, url) {
    return {
        // GET
        getLogs: function() {
            return $http.get(url.get() + '/logs/auth');
        },
        // DELETE
        clearLogs: function(Obj) {
            return $http.delete(url.get() + '/logs/auth');
        }
    };
});
