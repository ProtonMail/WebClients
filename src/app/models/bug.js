angular.module('proton.models.bug', [])

.factory('Bug', ($http, url) => {
    return {
        report(data) {
            return $http.post(url.get() + '/bugs', data);
        }
    };
});
