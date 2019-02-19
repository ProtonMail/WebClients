/* @ngInject */
function vpnSettingsApi($http, url) {
    const requestURL = url.build('vpn/settings');
    const handleResult = ({ data = {} } = {}) => data.VPNSettings;
    const fetch = () => $http.get(requestURL()).then(handleResult);
    const updateName = (data) => $http.put(requestURL('name'), data).then(handleResult);
    const updatePassword = (data) => $http.put(requestURL('password'), data).then(handleResult);

    return { fetch, updateName, updatePassword };
}
export default vpnSettingsApi;
