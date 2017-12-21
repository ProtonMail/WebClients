/* @ngInject */
function settingsApi($http, url, srp) {
    const requestURL = url.build('settings');

    const errorSRP = (error = {}) => {
        throw error.error_description || error;
    };

    const password = (newPassword = '') => {
        return srp
            .getPasswordParams(newPassword)
            .then((data) => $http.put(requestURL('password'), data))
            .catch(errorSRP);
    };

    const passwordReset = (params, creds) => {
        return srp.performSRPRequest('PUT', '/settings/reset', params, creds).catch(errorSRP);
    };

    const noticeEmail = (params, creds) => {
        return srp.performSRPRequest('PUT', '/settings/noticeemail', params, creds).catch(errorSRP);
    };

    const setLogging = (params) => {
        return $http.put(requestURL('logauth'), params).then(({ data = {} }) => {
            if (data.Code !== 1000) {
                throw new Error(data.Error);
            }
            return data;
        });
    };

    const enableTwoFactor = (params, creds) => {
        return srp.performSRPRequest('POST', '/settings/2fa', params, creds).catch(errorSRP);
    };

    const disableTwoFactor = (creds = {}) => {
        return srp.performSRPRequest('PUT', '/settings/2fa', {}, creds).catch(errorSRP);
    };
    const theme = (data) => {
        $http.put(requestURL('theme'), data).then(({ data = {} } = {}) => {
            if (data.Code !== 1000) {
                throw new Error(data.Error);
            }
            return data;
        });
    };

    const passwordUpgrade = (data) => $http.put(requestURL('password', 'upgrade'), data);
    const signature = (data) => $http.put(requestURL('signature'), data);
    const updatePMSignature = (data) => $http.put(requestURL('pmsignature'), data);
    const display = (data) => $http.put(requestURL('display'), data);
    const notify = (data) => $http.put(requestURL('notify'), data);
    const autosave = (data) => $http.put(requestURL('autosave'), data);
    const setLanguage = (data) => $http.put(requestURL('language'), data);
    const setComposerMode = (data) => $http.put(requestURL('composermode'), data);
    const setMessageStyle = (data) => $http.put(requestURL('messagebuttons'), data);
    const setShowImages = (data) => $http.put(requestURL('showimages'), data);
    const setShowEmbedded = (data) => $http.put(requestURL('showembedded'), data);
    const setViewlayout = (data) => $http.put(requestURL('viewlayout'), data);
    const setViewMode = (data) => $http.put(requestURL('viewmode'), data);
    const setHotkeys = (data) => $http.put(requestURL('hotkeys'), data);
    const setThreading = (data) => $http.put(requestURL('threading'), data);
    const setNews = (data) => $http.put(requestURL('news'), data);
    const setAutoresponder = (data) => $http.put(requestURL('autoresponder'), data);
    const invoiceText = (data) => $http.put(requestURL('invoicetext'), data);
    const alsoArchive = (data) => $http.put(requestURL('alsoarchive'), data);
    const updateMoved = (data) => $http.put(requestURL('moved'), data);
    const updateVPNName = (data) => $http.put(requestURL('vpnname'), data);
    const updateVPNPassword = (data) => $http.put(requestURL('vpnpassword'), data);
    const updateAutowildcard = (data) => $http.put(requestURL('autowildcard'), data);
    const updateDraftType = (data) => $http.put(requestURL('drafttype'), data);

    return {
        password,
        passwordReset,
        noticeEmail,
        setLogging,
        enableTwoFactor,
        disableTwoFactor,
        passwordUpgrade,
        signature,
        updatePMSignature,
        display,
        theme,
        notify,
        autosave,
        setLanguage,
        setComposerMode,
        setMessageStyle,
        setShowImages,
        setShowEmbedded,
        setViewlayout,
        setViewMode,
        setHotkeys,
        setThreading,
        setNews,
        setAutoresponder,
        invoiceText,
        alsoArchive,
        updateMoved,
        updateVPNName,
        updateVPNPassword,
        updateAutowildcard,
        updateDraftType
    };
}
export default settingsApi;
