angular.module("proton.models.user", [])

.factory("User", function($resource, $injector, url) {
    var authentication = $injector.get("authentication");

    return $resource(
        url.get() + "/users/:id",
        authentication.params({
            id: "@id",
            token: "@token"
        }),
        {
            // POST
            updateKeys: {
                method: 'put',
                url: url.get() + '/users/keys'
            },
            create: {
                method: 'post',
                url: url.get() + '/users/:token'
            },
            // GET
            pubkeys: {
                method: 'get',
                url: url.get() + '/users/pubkeys/:emails'
            },
            available: {
                method: 'get',
                url: url.get() + '/users/available/:username'
            },
            // PUT
            keys: {
                method: 'put',
                url: url.get() + '/users/keys'
            }
        }
    );
});
