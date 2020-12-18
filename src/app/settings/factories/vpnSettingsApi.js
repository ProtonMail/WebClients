/* @ngInject */
function vpnSettingsApi($http, url) {
    const requestURL = url.build('vpn/settings');
    const handleResult = ({ data = {} } = {}) => data.VPNSettings;
    const fetch = () => $http.get(requestURL()).then(handleResult);
    const resetSettings = () => $http.put(requestURL('reset'), {}).then(handleResult);

    return { fetch, resetSettings };
}
export default vpnSettingsApi;
