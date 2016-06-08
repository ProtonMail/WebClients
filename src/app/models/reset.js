angular.module("proton.models.reset", [])

.factory("Reset", function($http, url) {
    return {
        // POST
        requestResetToken: function(Obj) {
            return $http.post(url.get() + '/reset', Obj);
        },
        resetPassword: function(Obj) {
            return $http.post(url.get() + '/reset/' + encodeURIComponent(Obj.Token), Obj);
        },
        getMailboxResetToken: function(Obj) {
            return $http.post(url.get() + '/reset/mailbox', Obj);
        },
        resetMailbox: function(Obj) {
            return $http.post(url.get() + '/reset/mailbox/' + encodeURIComponent(Obj.Token), Obj);
        },
        // GET
        validateResetToken: function(Obj) {
            return $http.get(url.get() + '/reset/' + Obj.username + '/' + encodeURIComponent(Obj.token));
        }
    };
});
