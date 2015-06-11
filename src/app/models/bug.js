angular.module("proton.models.bug", [])

.factory("Bug", function($injector, $resource) {
    var authentication = $injector.get("authentication");

    return $resource(authentication.baseURL + "/bugs", authentication.params({id: "@id"}));
});
