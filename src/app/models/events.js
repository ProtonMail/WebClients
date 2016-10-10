angular.module('proton.models.events', [])
    .factory('Events', ($http, url) => ({
        get(id) {
            return $http.get(url.get() + '/events/' + id);
        },
        getLatestID() {
            return $http.get(url.get() + '/events/latest');
        }
    }));
