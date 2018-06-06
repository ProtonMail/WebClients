/* @ngInject */
function settingsApi($http, url, srp, userSettingsModel) {
    const requestURL = url.build('settings');
    const handleResult = ({ data = {} } = {}) => {
        userSettingsModel.set('all', data.UserSettings);
        return data;
    };

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
        return srp
            .performSRPRequest('PUT', '/settings/email/reset', params, creds)
            .then(handleResult)
            .catch(errorSRP);
    };

    const updateEmail = (params, creds) => {
        return srp
            .performSRPRequest('PUT', '/settings/email', params, creds)
            .then(handleResult)
            .catch(errorSRP);
    };

    const enableTwoFactor = (params, creds) => {
        return srp
            .performSRPRequest('POST', '/settings/2fa', params, creds)
            .then(handleResult)
            .catch(errorSRP);
    };

    const disableTwoFactor = (creds = {}) => {
        return srp
            .performSRPRequest('PUT', '/settings/2fa', {}, creds)
            .then(handleResult)
            .catch(errorSRP);
    };

    const passwordUpgrade = (data) => $http.put(requestURL('password', 'upgrade'), data);
    const fetch = () => $http.get(requestURL()).then(handleResult);
    const setLogging = (params) => $http.put(requestURL('logauth'), params).then(handleResult);
    const notify = (data) => $http.put(requestURL('email', 'notify'), data).then(handleResult);
    const updateLocale = (data) => $http.put(requestURL('locale'), data).then(handleResult);
    const setNews = (data) => $http.put(requestURL('news'), data).then(handleResult);
    const invoiceText = (data) => $http.put(requestURL('invoicetext'), data).then(handleResult);

    return {
        fetch,
        password,
        passwordReset,
        updateEmail,
        setLogging,
        enableTwoFactor,
        disableTwoFactor,
        passwordUpgrade,
        notify,
        updateLocale,
        setNews,
        invoiceText
    };
}
export default settingsApi;
