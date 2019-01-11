/* @ngInject */
function vpnApi($http, url) {
    const requestURL = url.build('vpn');
    const get = () => $http.get(requestURL());
    return { get };
}
export default vpnApi;
