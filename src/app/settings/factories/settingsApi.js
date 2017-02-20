angular.module('proton.settings')
.factory('settingsApi', ($http, url, srp) => {
    const getUrl = url.build('settings');
    return {
        password(newPassword = '') {
            return srp.getPasswordParams(newPassword)
            .then((data) => $http.put(getUrl('password'), data))
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
            return $http.put(getUrl('password', 'upgrade'), params);
        },
        noticeEmail(params, creds) {
            return srp
                .performSRPRequest('PUT', '/settings/noticeemail', params, creds)
                .catch((error = {}) => {
                    throw error.error_description || error;
                });
        },
        signature(params) {
            return $http.put(getUrl('signature'), params);
        },
        updatePMSignature(params) {
            return $http.put(getUrl('pmsignature'), params);
        },
        display(params) {
            return $http.put(getUrl('display'), params);
        },
        theme(params) {
            return $http.put(getUrl('theme'), params);
        },
        notify(params) {
            return $http.put(getUrl('notify'), params);
        },
        autosave(params) {
            return $http.put(getUrl('autosave'), params);
        },
        setLanguage(params) {
            return $http.put(getUrl('language'), params);
        },
        setLogging(params) {
            return $http.put(getUrl('logauth'), params);
        },
        setComposerMode(params) {
            return $http.put(getUrl('composermode'), params);
        },
        setMessageStyle(params) {
            return $http.put(getUrl('messagebuttons'), params);
        },
        setShowImages(params) {
            return $http.put(getUrl('showimages'), params);
        },
        setShowEmbedded(params) {
            return $http.put(getUrl('showembedded'), params);
        },
        setViewlayout(params) {
            return $http.put(getUrl('viewlayout'), params);
        },
        setViewMode(params) {
            return $http.put(getUrl('viewmode'), params);
        },
        setHotkeys(params) {
            return $http.put(getUrl('hotkeys'), params);
        },
        setThreading(params) {
            return $http.put(getUrl('threading'), params);
        },
        setNews(params) {
            return $http.put(getUrl('news'), params);
        },
        invoiceText(params) {
            return $http.put(getUrl('invoicetext'), params);
        },
        alsoArchive(params) {
            return $http.put(getUrl('alsoarchive'), params);
        },
        enableTwoFactor(params, creds) {
            return srp.performSRPRequest('POST', '/settings/2fa', params, creds)
            .catch((error = {}) => Promise.reject(error.error_description || error));
        },
        disableTwoFactor(creds = {}) {
            return srp.performSRPRequest('PUT', '/settings/2fa', {}, creds)
            .catch((error = {}) => Promise.reject(error.error_description || error));
        },
        updateVPNName(params) {
            return $http.put(getUrl('vpnname'), params);
        },
        updateVPNPassword(params) {
            return $http.put(getUrl('vpnpassword'), params);
        }
    };
});
