angular.module("proton.models.contact", [])

.factory("Contact", function($resource, $injector) {
    var authentication = $injector.get("authentication");

    return $resource(
        authentication.baseURL + "/contacts/:id",
        authentication.params({id: "@id"}),
        {
            edit: {
                method: 'put',
                url: authentication.baseURL + "/contacts/:id"
            },
            save: {
                method: 'post',
                url: authentication.baseURL + "/contacts/",
                isArray: true
            },
            delete: {
                method: 'put',
                url: authentication.baseURL + "/contacts/delete",
                isArray: true
            }
        }
    );
});
