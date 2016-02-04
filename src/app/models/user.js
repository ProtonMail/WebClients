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
            code :{
                method: 'post',
                url: url.get() + '/users/code'
            },
            // GET
            get: {
                method: 'get',
                url: url.get() + '/users'
            },
            pubkeys: {
                method: 'get',
                url: url.get() + '/users/pubkeys/:emails'
            },
            available: {
                method: 'get',
                url: url.get() + '/users/available/:username'
            },
            direct: {
                method: 'get',
                url: url.get() + '/users/direct'
            },
            // PUT
            keys: {
                method: 'put',
                url: url.get() + '/users/keys'
            },
            lock: {
                method: 'put',
                url: url.get() + '/users/lock'
            },
            unlock: {
                method: 'put',
                url: url.get() + '/users/unlock'
            }
        }
    );
});
