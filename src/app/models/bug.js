angular.module("proton.models.bug", [])

.factory("Bug", function($http, $rootScope) {
    return {
        report: function(data) {
            return $http.post($rootScope.baseURL + '/bugs', data);
        }
    };
});
