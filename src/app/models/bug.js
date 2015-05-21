angular.module("proton.models.bug", [])

.factory("Bug", function($injector, $resource) {
    var authentication = $injector.get("authentication");

    return $resource(
        authentication.baseURL + "/users/:UserID",
        authentication.params(), {
            // Send bug report
            bugs: {
                method: 'post',
                url: authentication.baseURL + "/bugs",
                isArray: true
            }
        }
    );
});
