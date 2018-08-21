/* @ngInject */
function dynamicStates(mailSettingsModel) {
    const getDraftsState = (prefix = 'secured.') => {
        return mailSettingsModel.draftsIncluded() ? `${prefix}allDrafts` : `${prefix}drafts`;
    };

    const getSentState = (prefix = 'secured.') => {
        return mailSettingsModel.sentIncluded() ? `${prefix}allSent` : `${prefix}sent`;
    };

    return { getDraftsState, getSentState };
}
export default dynamicStates;
