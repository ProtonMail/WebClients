angular.module("proton.models.attachment", [])

.factory("Attachment", function($resource, $injector, url) {
    var authentication = $injector.get("authentication");

    return $resource(
        url.get() + "/attachments/:id",
        authentication.params({ id: "@id" }),
        {
            // POST
            upload: {
                method: 'post',
                url: url.get() + '/attachments/upload'
            },
            remove: {
                method: 'put',
                url: url.get() + '/attachments/remove'
            }
        }
    );
});
