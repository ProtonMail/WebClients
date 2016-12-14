angular.module('proton.models.setting', [])
.factory('Setting', ($http, url, srp) => {
    const Setting = {
        password(newPassword = '') {
            return srp.getPasswordParams(newPassword)
            .then((data) => $http.put(url.get() + '/settings/password', data))
            .catch((error = {}) => Promise.reject(error.error_description || error));
        },
        passwordReset(params, creds) {
            return srp
                .performSRPRequest('PUT', '/settings/reset', params, creds)
                .catch((error = {}) => {
                    throw error.error_description || error;
                });
        },
        passwordUpgrade(params) {
            return $http.put(url.get() + '/settings/password/upgrade', params);
        },
        noticeEmail(params, creds) {
            return srp
                .performSRPRequest('PUT', '/settings/noticeemail', params, creds)
                .catch((error = {}) => {
                    throw error.error_description || error;
                });
        },
        signature(params) {
            return $http.put(url.get() + '/settings/signature', params);
        },
        PMSignature(params) {
            return $http.put(url.get() + '/settings/pmsignature', params);
        },
        display(params) {
            return $http.put(url.get() + '/settings/display', params);
        },
        theme(params) {
            return $http.put(url.get() + '/settings/theme', params);
        },
        notify(params) {
            return $http.put(url.get() + '/settings/notify', params);
        },
        autosave(params) {
            return $http.put(url.get() + '/settings/autosave', params);
        },
        setLanguage(params) {
            return $http.put(url.get() + '/settings/language', params);
        },
        setLogging(params) {
            return $http.put(url.get() + '/settings/logauth', params);
        },
        setComposerMode(params) {
            return $http.put(url.get() + '/settings/composermode', params);
        },
        setMessageStyle(params) {
            return $http.put(url.get() + '/settings/messagebuttons', params);
        },
        setShowImages(params) {
            return $http.put(url.get() + '/settings/showimages', params);
        },
        setShowEmbedded(params) {
            return $http.put(url.get() + '/settings/showembedded', params);
        },
        setViewlayout(params) {
            return $http.put(url.get() + '/settings/viewlayout', params);
        },
        setViewMode(params) {
            return $http.put(url.get() + '/settings/viewmode', params);
        },
        setHotkeys(params) {
            return $http.put(url.get() + '/settings/hotkeys', params);
        },
        setThreading(params) {
            return $http.put(url.get() + '/settings/threading', params);
        },
        invoiceText(params) {
            return $http.put(url.get() + '/settings/invoicetext', params);
        },
        alsoArchive(params) {
            return $http.put(url.get() + '/settings/alsoarchive', params);
        },
        enableTwoFactor(params, creds) {
            return srp.performSRPRequest('POST', '/settings/2fa', params, creds)
            .catch((error = {}) => Promise.reject(error.error_description || error));
        },
        disableTwoFactor(creds = {}) {
            return srp.performSRPRequest('PUT', '/settings/2fa', {}, creds)
            .catch((error = {}) => Promise.reject(error.error_description || error));
        }
    };

    return Setting;
});
