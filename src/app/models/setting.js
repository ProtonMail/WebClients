angular.module("proton.models.setting", [])

.factory("Setting", function($injector, $resource) {
    var authentication = $injector.get("authentication");

    return $resource(
        authentication.baseURL + "/users/:UserID",
        authentication.params(), {
            // Update user's password
            updatePassword: {
                method: 'put',
                url: authentication.baseURL + "/setting/password"
            },
            // Update mailbox's password
            keyPassword: {
                method: 'put',
                url: authentication.baseURL + "/setting/keypwd"
            },
            // Update notification email
            notificationEmail: {
                method: 'put',
                url: authentication.baseURL + "/setting/noticeemail"
            },
            // Update signature
            signature: {
                method: 'put',
                url: authentication.baseURL + "/setting/signature"
            },
            // Update aliases
            aliases: {
                method: 'put',
                url: authentication.baseURL + "/setting/domainorder"
            },
            // Update the user's display name
            dislayName: {
                method: 'put',
                url: authentication.baseURL + "/setting/display"
            }
        }
    );
});
