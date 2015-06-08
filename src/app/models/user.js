angular.module("proton.models.user", [])

.factory("User", function($resource, $injector) {
    var authentication = $injector.get("authentication");

    return $resource(
        authentication.baseURL + "/users/:id",
        authentication.params({ id: "@id" }),
        {
            // POST
            updateKeys: {
                method: 'post',
                url: authentication.baseURL + '/users'
            },
            // GET
            pubkeys: {
                method: 'get',
                url: authentication.baseURL + '/users/pubkeys/:emails'
            },
            check: {
                method: 'get',
                url: authentication.baseURL + '/users/check/:username'
            },
            // PUT
            keys: {
                method: 'put',
                url: authentication.baseURL + '/users/keys'
            }
        }
    );
});
