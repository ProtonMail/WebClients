angular.module("proton.models.bug", [])

.factory("Bug", function($http, url) {
    return {
        report: function(data) {
            return $http.post(url.get() + '/bugs', data);
        }
    };
});
