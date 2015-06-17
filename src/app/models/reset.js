angular.module("proton.models.reset", [])

.factory("Reset", function($http, authentication) {
    return {
        // POST
        requestResetToken: function(Obj) {
            return $http.post(authentication.baseURL + '/reset', Obj);
        },
        resetPassword: function(Obj) {
            return $http.post(authentication.baseURL + '/reset/' + encodeURIComponent(Obj.Token), Obj);
        },
        // GET
        validateResetToken: function(Obj) {
            return $http.get(authentication.baseURL + '/reset/' + encodeURIComponent(Obj.token));
        }
    };
});