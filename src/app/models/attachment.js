angular.module("proton.models.attachment", [])

.factory("Attachment", function($resource, $injector) {
    var authentication = $injector.get("authentication");

    return $resource(
        authentication.baseURL + "/attachments/:id",
        authentication.params({ id: "@id" }),
        {
            // POST
            upload: {
                method: 'post',
                url: authentication.baseURL + '/attachments/upload'
            }
        }
    );
});
