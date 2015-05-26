angular.module("proton.models.user", [])

.factory("User", function(
    $resource,
    $injector) {
    var authentication = $injector.get("authentication");
    // https://docs.angularjs.org/api/ngResource/service/$resource
    return $resource(
        authentication.baseURL + "/users/:UserID",
        authentication.params(), {
            get: {
                method: 'get',
                isArray: false,
                transformResponse: getFromJSONResponse()
            },
            pubkeys: {
                method: 'get',
                url: authentication.baseURL + "/users/pubkeys/:Emails",
                isArray: true,
                transformResponse: getFromJSONResponse()
            },
            createUser: {
                method: 'post',
                url: authentication.baseURL + "/users"
            },
            updateKeypair: {
                method: 'post',
                url: authentication.baseURL + "/users/key"
            },
            checkUserExist: {
                method: 'get',
                url: authentication.baseURL + "/users/check/:username"
            },
            checkInvite: {
                method: 'get',
                url: authentication.baseURL + "/users/check/:username"
            },
            getUserStatus: {
                method: 'get',
                url: authentication.baseURL + "/users/status"
            },
            checkResetToken: {
                method: 'get',
                url: authentication.baseURL + "/reset/password/:token",
            },
            resetPassword: {
                method: 'post',
                url: authentication.baseURL + "/reset/password" // update the password
            },
            resetLostPassword: {
                method: 'post',
                url: authentication.baseURL + "/reset/lost-password" //sends notification email to the user
            },
            updatePassword: {
                method: 'put',
                url: authentication.baseURL + "/setting/password"
            },
            keyPassword: {
                method: 'put',
                url: authentication.baseURL + "/setting/keypwd"
            },
            notificationEmail: {
                method: 'put',
                url: authentication.baseURL + "/setting/noticeemail"
            },
            notify: {
                method: 'put',
                url: authentication.baseURL + "/setting/notify"
            },
            signature: {
                method: 'put',
                url: authentication.baseURL + "/setting/signature"
            },
            aliases: {
                method: 'put',
                url: authentication.baseURL + "/setting/domainorder"
            },
            dislayName: {
                method: 'put',
                url: authentication.baseURL + "/setting/display"
            },
            autosaveContacts: {
                method: 'put',
                url: authentication.baseURL + "/setting/autosave"
            },
            theme: {
                method: 'put',
                url: authentication.baseURL + "/setting/theme"
            }
        }
    );
});
