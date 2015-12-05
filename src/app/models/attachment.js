angular.module("proton.models.attachment", [])

.factory("Attachment", function($http, url) {
    var api = {
        remove: function(params) {
            return $http.put(url.get() + '/attachments/remove', params);
        }
    };

    return api;
});
