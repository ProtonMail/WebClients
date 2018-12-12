/* @ngInject */
function Logs($http, url) {
    const requestURL = url.build('logs');
    const get = () => {
        return $http.get(requestURL('auth')).then(({ data }) => data.Logs);
    };
    const clear = () => $http.delete(requestURL('auth'));

    return { get, clear };
}
export default Logs;
