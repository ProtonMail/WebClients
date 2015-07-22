angular.module("proton.models.user", [])

.factory("User", function($resource, $injector, $rootScope) {
    var authentication = $injector.get("authentication");

    return $resource(
        $rootScope.baseURL + "/users/:id",
        authentication.params({
            id: "@id",
            token: "@token"
        }),
        {
            // POST
            updateKeys: {
                method: 'put',
                url: $rootScope.baseURL + '/users/keys'
            },
            create: {
                method: 'post',
                url: $rootScope.baseURL + '/users/:token'
            },
            // GET
            pubkeys: {
                method: 'get',
                url: $rootScope.baseURL + '/users/pubkeys/:emails'
            },
            available: {
                method: 'get',
                url: $rootScope.baseURL + '/users/available/:username'
            },
            // PUT
            keys: {
                method: 'put',
                url: $rootScope.baseURL + '/users/keys'
            }
        }
    );
});
