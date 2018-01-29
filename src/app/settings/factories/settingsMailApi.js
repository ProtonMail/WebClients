/* @ngInject */
function settingsMailApi($http, gettextCatalog, mailSettingsModel, url) {
    const I18N = {
        ERROR_SAVE_INPUT: gettextCatalog.getString('Unable to save your changes, your signature is too large.', null, 'Error')
    };
    const requestURL = url.build('settings/mail');
    const handleResult = ({ data = {} } = {}) => {
        mailSettingsModel.set('all', data.MailSettings);
        return data;
    };
    const handleError = ({ data = {} } = {}) => {
        // USER_UPDATE_SIGNATURE_TOO_LARGE
        if (data.Code === 12010) {
            throw new Error(I18N.ERROR_SAVE_INPUT);
        }

    const handleResponse = (promise) => promise.then(handleResult).catch(handleError);
    const fetch = () => $http.get(requestURL()).then(handleResponse);
    const updateTheme = (data) => $http.put(requestURL('theme'), data).then(handleResponse);
    const updateAutoSaveContacts = (data) => $http.put(requestURL('autocontacts'), data).then(handleResponse);
    const updateComposerMode = (data) => $http.put(requestURL('composermode'), data).then(handleResponse);
    const updateMessageButtons = (data) => $http.put(requestURL('messagebuttons'), data).then(handleResponse);
    const updateShowImages = (data) => $http.put(requestURL('images'), data).then(handleResponse);
    const updateShowMoved = (data) => $http.put(requestURL('moved'), data).then(handleResponse);
    const updateViewMode = (data) => $http.put(requestURL('viewmode'), data).then(handleResponse);
    const updateViewLayout = (data) => $http.put(requestURL('viewlayout'), data).then(handleResponse);
    const updateSwipeLeft = (data) => $http.put(requestURL('swipeleft'), data).then(handleResponse);
    const updateSwipeRight = (data) => $http.put(requestURL('swiperight'), data).then(handleResponse);
    const updateAlsoArchive = (data) => $http.put(requestURL('alsoarchive'), data).then(handleResponse);
    const updateHotkeys = (data) => $http.put(requestURL('hotkeys'), data).then(handleResponse);
    const updatePMSignature = (data) => $http.put(requestURL('pmsignature'), data).then(handleResponse);
    const updateAutowildcard = (data) => $http.put(requestURL('autowildcard'), data).then(handleResponse);
    const updateDraftType = (data) => $http.put(requestURL('drafttype'), data).then(handleResponse);
    const updateReceiveType = (data) => $http.put(requestURL('receivetype'), data).then(handleResponse);
    const updateShowType = (data) => $http.put(requestURL('showtype'), data).then(handleResponse);
    const updateImageProxy = (data) => $http.put(requestURL('imageproxy'), data).then(handleResponse);
    const updateTLS = (data) => $http.put(requestURL('tls'), data).then(handleResponse);
    const updateRightToLeft = (data) => $http.put(requestURL('righttoleft'), data).then(handleResponse);
    const updateAttachPublicKey = (data) => $http.put(requestURL('attachpublic'), data).then(handleResponse);
    const updateAutoresponder = (data) => $http.put(requestURL('autoresponder'), data).then(handleResponse);

    return {
        fetch,
        updateTheme,
        updateAutoSaveContacts,
        updateComposerMode,
        updateMessageButtons,
        updateShowImages,
        updateShowMoved,
        updateViewMode,
        updateViewLayout,
        updateSwipeLeft,
        updateSwipeRight,
        updateAlsoArchive,
        updateHotkeys,
        updatePMSignature,
        updateAutowildcard,
        updateDraftType,
        updateReceiveType,
        updateShowType,
        updateImageProxy,
        updateTLS,
        updateRightToLeft,
        updateAttachPublicKey,
        updateAutoresponder
    };
}

export default settingsMailApi;
