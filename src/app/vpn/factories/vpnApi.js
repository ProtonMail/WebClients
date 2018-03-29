/* @ngInject */
function vpnApi($http, url, gettextCatalog) {

    const requestUrl = url.build('vpn');
    const ERROR = gettextCatalog.getString('VPN request failed', null, 'Error');

    const onSuccess = ({ data = {} }) => data.VPN;
    const onError = (error = ERROR) => ({ data = {} }) => {
        throw new Error(data.Error || error);
    };

    const get = () => $http.get(requestUrl()).then(onSuccess).catch(onError());
    const auth = (params) => $http.post(requestUrl('auth'), params);
    const accounting = (params) => $http.post(requestUrl('accounting'), params);

    return { get, auth, accounting };
}
export default vpnApi;
