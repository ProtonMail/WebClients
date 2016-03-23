angular.module("proton.models.setting", [])

.factory("Setting", function($resource, $injector, url, authentication) {
    return $resource(
        url.get() + "/settings/:id",
        authentication.params({ id: "@id" }),
        {
            password: {
                method: 'put',
                url: url.get() + '/settings/password'
            },
            noticeEmail: {
                method: 'put',
                url: url.get() + '/settings/noticeemail'
            },
            signature: {
                method: 'put',
                url: url.get() + '/settings/signature'
            },
            display: {
                method: 'put',
                url: url.get() + '/settings/display'
            },
            addressOrder: {
                method: 'put',
                url: url.get() + '/settings/addressorder'
            },
            theme: {
                method: 'put',
                url: url.get() + '/settings/theme'
            },
            notify: {
                method: 'put',
                url: url.get() + '/settings/notify'
            },
            autosave: {
                method: 'put',
                url: url.get() + '/settings/autosave'
            },
            setLanguage: {
                method: 'put',
                url: url.get() + '/settings/language'
            },
            setLogging: {
                method: 'put',
                url: url.get() + '/settings/logauth'
            },
            setComposerMode: {
                method: 'put',
                url: url.get() + '/settings/composermode'
            },
            setMessageStyle: {
                method: 'put',
                url: url.get() + '/settings/messagebuttons'
            },
            setShowImages: {
                method: 'put',
                url: url.get() + '/settings/showimages'
            },
            /**
             * Update view layout flag
             */
            setViewlayout: {
                method: 'put',
                url: url.get() + '/settings/viewlayout'
            },
            /**
             * Update view mode flag
             */
            setViewMode: {
                method: 'put',
                url: url.get() + '/settings/viewmode'
            },
            apiTest: {
                method: 'get',
                url: url.get() + '/tests/error'
            },
            invoiceText: {
                method: 'put',
                url: url.get() + '/settings/invoicetext'
            }
        }
    );
});
