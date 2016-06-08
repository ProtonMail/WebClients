angular.module('proton.models.setting', [])

.factory('Setting', function($http, url) {
    var Setting = {
        password: function(params) {
            return $http.put(url.get() + '/settings/password', params);
        },
        noticeEmail: function(params) {
            return $http.put(url.get() + '/settings/noticeemail', params);
        },
        signature: function(params) {
            return $http.put(url.get() + '/settings/signature', params);
        },
        display: function(params) {
            return $http.put(url.get() + '/settings/display', params);
        },
        addressOrder: function(params) {
            return $http.put(url.get() + '/settings/addressorder', params);
        },
        theme: function(params) {
            return $http.put(url.get() + '/settings/theme', params);
        },
        notify: function(params) {
            return $http.put(url.get() + '/settings/notify', params);
        },
        autosave: function(params) {
            return $http.put(url.get() + '/settings/autosave', params);
        },
        setLanguage: function(params) {
            return $http.put(url.get() + '/settings/language', params);
        },
        setLogging: function(params) {
            return $http.put(url.get() + '/settings/logauth', params);
        },
        setComposerMode: function(params) {
            return $http.put(url.get() + '/settings/composermode', params);
        },
        setMessageStyle: function(params) {
            return $http.put(url.get() + '/settings/messagebuttons', params);
        },
        setShowImages: function(params) {
            return $http.put(url.get() + '/settings/showimages', params);
        },
        setViewlayout: function(params) {
            return $http.put(url.get() + '/settings/viewlayout', params);
        },
        setViewMode: function(params) {
            return $http.put(url.get() + '/settings/viewmode', params);
        },
        invoiceText: function(params) {
            return $http.put(url.get() + '/settings/invoicetext', params);
        },
        alsoArchive: function(params) {
            return $http.put(url.get() + '/settings/alsoarchive', params);
        }
    };

    return Setting;
});
