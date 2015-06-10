angular.module("proton.models.setting", [])

.factory("Setting", function($resource, $injector) {
    var authentication = $injector.get("authentication");

    return $resource(
        authentication.baseURL + "/settings/:id",
        authentication.params({ id: "@id" }),
        {
            password: {
                method: 'put',
                url: authentication.baseURL + '/settings/password'
            },
            noticeEmail: {
                method: 'put',
                url: authentication.baseURL + '/settings/noticeemail'
            },
            signature: {
                method: 'put',
                url: authentication.baseURL + '/settings/signature'
            },
            display: {
                method: 'put',
                url: authentication.baseURL + '/settings/display'
            },
            addressOrder: {
                method: 'put',
                url: authentication.baseURL + '/settings/addressorder'
            },
            theme: {
                method: 'put',
                url: authentication.baseURL + '/settings/theme'
            },
            notify: {
                method: 'put',
                url: authentication.baseURL + '/settings/notify'
            },
            autosave: {
                method: 'put',
                url: authentication.baseURL + '/settings/autosave'
            },
            setLanguage: {
                method: 'put',
                url: authentication.baseURL + '/settings/language'
            }
        }
    );
});
