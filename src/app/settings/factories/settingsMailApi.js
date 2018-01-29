/* @ngInject */
function settingsMailApi($http, mailSettingsModel, url) {
    const requestURL = url.build('settings/mail');
    const handleResult = ({ data = {} } = {}) => {
        if (data.Error) {
            throw new Error(data.Error);
        }

        if (data.Code === 1000) {
            mailSettingsModel.set('all', data.MailSettings);
        }

        return data;
    };

    const fetch = () => $http.get(requestURL()).then(handleResult);
    const updateTheme = (data) => $http.put(requestURL('theme'), data).then(handleResult);
    const updateAutoSaveContacts = (data) => $http.put(requestURL('autocontacts'), data).then(handleResult);
    const updateComposerMode = (data) => $http.put(requestURL('composermode'), data).then(handleResult);
    const updateMessageButtons = (data) => $http.put(requestURL('messagebuttons'), data).then(handleResult);
    const updateShowImages = (data) => $http.put(requestURL('images'), data).then(handleResult);
    const updateShowMoved = (data) => $http.put(requestURL('moved'), data).then(handleResult);
    const updateViewMode = (data) => $http.put(requestURL('viewmode'), data).then(handleResult);
    const updateViewLayout = (data) => $http.put(requestURL('viewlayout'), data).then(handleResult);
    const updateSwipeLeft = (data) => $http.put(requestURL('swipeleft'), data).then(handleResult);
    const updateSwipeRight = (data) => $http.put(requestURL('swiperight'), data).then(handleResult);
    const updateAlsoArchive = (data) => $http.put(requestURL('alsoarchive'), data).then(handleResult);
    const updateHotkeys = (data) => $http.put(requestURL('hotkeys'), data).then(handleResult);
    const updatePMSignature = (data) => $http.put(requestURL('pmsignature'), data).then(handleResult);
    const updateAutowildcard = (data) => $http.put(requestURL('autowildcard'), data).then(handleResult);
    const updateDraftType = (data) => $http.put(requestURL('drafttype'), data).then(handleResult);
    const updateReceiveType = (data) => $http.put(requestURL('receivetype'), data).then(handleResult);
    const updateShowType = (data) => $http.put(requestURL('showtype'), data).then(handleResult);
    const updateImageProxy = (data) => $http.put(requestURL('imageproxy'), data).then(handleResult);
    const updateTLS = (data) => $http.put(requestURL('tls'), data).then(handleResult);
    const updateRightToLeft = (data) => $http.put(requestURL('righttoleft'), data).then(handleResult);
    const updateAttachPublicKey = (data) => $http.put(requestURL('attachpublic'), data).then(handleResult);
    const updateAutoresponder = (data) => $http.put(requestURL('autoresponder'), data).then(handleResult);

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
