angular.module('proton.models.logs', [])

.factory('Logs', ($http, url) => {
    return {
        // GET
        getLogs() {
            return $http.get(url.get() + '/logs/auth');
        },
        // DELETE
        clearLogs() {
            return $http.delete(url.get() + '/logs/auth');
        }
    };
});
