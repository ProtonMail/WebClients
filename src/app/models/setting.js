angular.module("proton.models.setting", [])

.factory("Setting", function($resource, $injector, $rootScope) {
    var authentication = $injector.get("authentication");

    return $resource(
        $rootScope.baseURL + "/settings/:id",
        authentication.params({ id: "@id" }),
        {
            password: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/password'
            },
            noticeEmail: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/noticeemail'
            },
            signature: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/signature'
            },
            display: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/display'
            },
            addressOrder: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/addressorder'
            },
            theme: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/theme'
            },
            notify: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/notify'
            },
            autosave: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/autosave'
            },
            setLanguage: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/language'
            },
            setLogging: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/logauth'
            },
            setComposerMode: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/composermode'
            },
            setMessageStyle: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/messagebuttons'
            },
            setShowImages: {
                method: 'put',
                url: $rootScope.baseURL + '/settings/showimages'
            },
            apiTest: {
                method: 'get',
                url: $rootScope.baseURL + '/tests/error'
            }
        }
    );
});
