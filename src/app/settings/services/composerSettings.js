/* @ngInject */
function composerSettings(authentication, settingsMailApi, networkActivityTracker, gettextCatalog, notification) {
    /**
     * Keeps track of the request as it's loading.
     * Relies on the settingsMailApi to throw an error to reject the promise.
     * @param promise
     */
    const trackUpdate = (promise) => {
        networkActivityTracker.track(promise);
        return promise;
    };

    const I18N = {
        successComposer(value) {
            return gettextCatalog.getString('Change composer mode to {{value}}', { value }, 'Info');
        },
        successTextDirection(value) {
            return gettextCatalog.getString('Change default text direction to {{value}}', { value }, 'Info');
        }
    };

    const updateComposerMode = (MIMEType, successMessage) =>
        trackUpdate(settingsMailApi.updateDraftType({ MIMEType })).then(() => notification.success(I18N.successComposer(successMessage)));

    const updateRightToLeft = (RightToLeft, successMessage) =>
        trackUpdate(settingsMailApi.updateRightToLeft({ RightToLeft })).then(() => notification.success(I18N.successTextDirection(successMessage)));

    return {
        updateComposerMode,
        updateRightToLeft
    };
}

export default composerSettings;
