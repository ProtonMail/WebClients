angular.module('proton.models.setting', ['proton.srp'])

.factory('Setting', function($http, url, srp) {
    var Setting = {
        password: function(creds = {}, newPassword = '') {
            return srp.randomVerifier(newPassword).then(function(auth_params) {
                return srp.performSRPRequest("PUT", '/settings/password', auth_params, creds);
            })
            .catch((error) => {
                if(error.error_description) {
                    return Promise.reject(error.error_description);
                }
                else {
                    return Promise.reject(error);
                }
            });
        },
        noticeEmail: function(params, creds) {
            return srp.performSRPRequest("PUT", '/settings/noticeemail', params, creds)
            .catch((error) => {
                if(error.error_description) {
                    return Promise.reject(error.error_description);
                }
                else {
                    return Promise.reject(error);
                }
            });
        },
        signature: function(params) {
            return $http.put(url.get() + '/settings/signature', params);
        },
        PMSignature: function(params){
            return $http.put(url.get() + '/settings/pmsignature', params);
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
        setShowEmbedded: function(params) {
            return $http.put(url.get() + '/settings/showembedded', params);
        },
        setViewlayout: function(params) {
            return $http.put(url.get() + '/settings/viewlayout', params);
        },
        setViewMode: function(params) {
            return $http.put(url.get() + '/settings/viewmode', params);
        },
        setHotkeys: function(params) {
            return $http.put(url.get() + '/settings/hotkeys', params);
        },
        setThreading(params) {
            return $http.put(url.get() + '/settings/threading', params);
        },
        invoiceText: function(params) {
            return $http.put(url.get() + '/settings/invoicetext', params);
        },
        alsoArchive: function(params) {
            return $http.put(url.get() + '/settings/alsoarchive', params);
        },
        enableTwoFactor: function(params, creds) {
            return srp.performSRPRequest("POST", '/settings/2fa', params, creds)
            .catch((error) => {
                if(error.error_description) {
                    return Promise.reject(error.error_description);
                }
                else {
                    return Promise.reject(error);
                }
            });
        },
        disableTwoFactor: function(creds = {}) {
            return srp.performSRPRequest("PUT", '/settings/2fa', {}, creds)
            .catch((error) => {
                if(error.error_description) {
                    return Promise.reject(error.error_description);
                }
                else {
                    return Promise.reject(error);
                }
            });
        }
    };

    return Setting;
});
