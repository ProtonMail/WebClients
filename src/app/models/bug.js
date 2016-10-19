angular.module('proton.models.bug', [])

.factory('Bug', ($http, url) => {
    return {
        crash(data) {
            return $http.post(url.get() + '/bugs/crash', data);
        },
        report(data) {
            return $http.post(url.get() + '/bugs', data);
        }
    };
});
