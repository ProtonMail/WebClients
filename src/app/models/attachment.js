angular.module("proton.models.attachment", [])

.factory("Attachment", function($resource, $injector, $rootScope) {
    var authentication = $injector.get("authentication");

    return $resource(
        $rootScope.baseURL + "/attachments/:id",
        authentication.params({ id: "@id" }),
        {
            // POST
            upload: {
                method: 'post',
                url: $rootScope.baseURL + '/attachments/upload'
            },
            remove: {
                method: 'put',
                url: $rootScope.baseURL + '/attachments/remove'
            }
        }
    );
});
