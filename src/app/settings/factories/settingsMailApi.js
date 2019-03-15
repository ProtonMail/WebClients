/* @ngInject */
function settingsMailApi($http, gettextCatalog, mailSettingsModel, url) {

    const requestURL = url.build('settings/mail');
    const handleResult = ({ data = {} } = {}) => {
        mailSettingsModel.set('all', data.MailSettings);
        return data;
    };

    const handleResponse = (promise) => promise.then(handleResult);
    const fetch = () => handleResponse($http.get(requestURL()));
    const updateTheme = (data) => handleResponse($http.put(requestURL('theme'), data));
    const updateAutoSaveContacts = (data) => handleResponse($http.put(requestURL('autocontacts'), data));
    const updateComposerMode = (data) => handleResponse($http.put(requestURL('composermode'), data));
    const updateMessageButtons = (data) => handleResponse($http.put(requestURL('messagebuttons'), data));
    const updateShowImages = (data) => handleResponse($http.put(requestURL('images'), data));
    const updateShowMoved = (data) => handleResponse($http.put(requestURL('moved'), data));
    const updateViewMode = (data) => handleResponse($http.put(requestURL('viewmode'), data));
    const updateViewLayout = (data) => handleResponse($http.put(requestURL('viewlayout'), data));
    const updateSwipeLeft = (data) => handleResponse($http.put(requestURL('swipeleft'), data));
    const updateSwipeRight = (data) => handleResponse($http.put(requestURL('swiperight'), data));
    const updateHotkeys = (data) => handleResponse($http.put(requestURL('hotkeys'), data));
    const updatePMSignature = (data) => handleResponse($http.put(requestURL('pmsignature'), data));
    const updateAutowildcard = (data) => handleResponse($http.put(requestURL('autowildcard'), data));
    const updateDraftType = (data) => handleResponse($http.put(requestURL('drafttype'), data));
    const updateReceiveType = (data) => handleResponse($http.put(requestURL('receivetype'), data));
    const updateShowType = (data) => handleResponse($http.put(requestURL('showtype'), data));
    const updateImageProxy = (data) => handleResponse($http.put(requestURL('imageproxy'), data));
    const updateTLS = (data) => handleResponse($http.put(requestURL('tls'), data));
    const updateRightToLeft = (data) => handleResponse($http.put(requestURL('righttoleft'), data));
    const updateAttachPublicKey = (data) => handleResponse($http.put(requestURL('attachpublic'), data));
    const updateAutoresponder = (data) => handleResponse($http.put(requestURL('autoresponder'), data));
    const updateAttachPublic = (data) => handleResponse($http.put(requestURL('attachpublic'), data));
    const updateSign = (data) => handleResponse($http.put(requestURL('sign'), data));
    const updatePgpScheme = (data) => handleResponse($http.put(requestURL('pgpscheme'), data));
    const updatePromptPin = (data) => handleResponse($http.put(requestURL('promptpin'), data));

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
        updateAutoresponder,
        updateAttachPublic,
        updateSign,
        updatePgpScheme,
        updatePromptPin
    };
}
export default settingsMailApi;
