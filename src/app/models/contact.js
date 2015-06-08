angular.module("proton.models.contact", [])

.factory("Contact", function($resource, authentication) {
    var Contact = $resource(authentication.baseURL + "/contacts/:id", authentication.params({id: "@id"}));

    return Contact;
});
