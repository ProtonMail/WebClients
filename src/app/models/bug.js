angular.module("proton.models.bug", [])

.factory("Bug", function($http, authentication) {
    return {
        report: function(data) {
            return $http.post(authentication.baseURL + '/bugs', data);
        }
    };
});
