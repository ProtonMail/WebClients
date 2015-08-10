angular.module("proton.models.attachment", [])

.factory("Attachment", function($resource, $injector, url) {
    var authentication = $injector.get("authentication");

    return $resource(
        url.get() + "/attachments/:id",
        authentication.params({ id: "@id" }),
        {
            remove: {
                method: 'put',
                url: url.get() + '/attachments/remove'
            }
        }
    );
});
