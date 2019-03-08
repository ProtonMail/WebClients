/* @ngInject */
function settingsApi($http, url, srp, userSettingsModel) {
    const requestURL = url.build('settings');

    const handleResult = ({ data = {} } = {}) => {
        userSettingsModel.set('all', data.UserSettings);
        return data;
    };

    const password = (Password = '') => srp.verify.put({ Password }, requestURL('password'));
    const passwordReset = (credentials, data) =>
        srp.auth.put(credentials, requestURL('email', 'reset'), data).then(handleResult);
    const updateEmail = (credentials, data) => srp.auth.put(credentials, requestURL('email'), data).then(handleResult);
    const enableTwoFactor = (credentials, data) =>
        srp.auth.post(credentials, requestURL('2fa'), data).then(handleResult);
    const disableTwoFactor = (credentials) => srp.auth.put(credentials, requestURL('2fa')).then(handleResult);
    const passwordUpgrade = (credentials) => srp.verify.put(credentials, requestURL('password', 'upgrade'));

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
