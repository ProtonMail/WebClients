/* @ngInject */
function Logs($http, url) {
    const requestURL = url.build('logs');
    const get = () => $http.get(requestURL('auth'));
    const clear = () => $http.delete(requestURL('auth'));

    return { get, clear };
}
export default Logs;
